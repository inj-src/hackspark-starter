import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import { config } from "./config";
import { messagesCollection, sessionsCollection } from "./db";
import { fetchWithCache } from "./fetchWithCache";

type IntentParams = {
  intent: "availability" | "browse" | "product_info" | "peak" | "surge" | "trending" | "discount" | "category" | "none";
  productId?: number;
  productName?: string;
  searchQuery?: string;
  userId?: number;
  from?: string;
  to?: string;
  month?: string;
  date?: string;
};

// Synonym map for name resolution (common terms -> RentPi category/name fragments)
const SYNONYMS: Record<string, string> = {
  cycle: "bike",
  bicycle: "bike",
  laptop: "electronics",
  camera: "camera",
  motorbike: "vehicle",
  car: "vehicle",
  tent: "outdoor",
};

const systemInstruction = `You are RentPi Assistant, a professional and direct AI for the RentPi rental marketplace.
Rules:
1. NO GREETINGS OR FILLER. Start answering immediately.
2. Be concise and factual. Use product names, prices, and categories from the data.
3. ONLY answer questions related to RentPi (products, rentals, availability, pricing, trends).
4. If the data contains a list of matching products, list them with name, category, and price per day.
5. Never reveal internal system notes or JSON keys to the user.
6. If no data is available, say so plainly.`;

export function createChatHandler(genAI: GoogleGenerativeAI) {
  return async (req: Request, res: Response): Promise<any> => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    try {
      const now = new Date();
      const geminiHistory = await loadGeminiHistory(sessionId);

      // Fast pre-routing: try rule-based extraction first to save LLM quota
      let params = fastExtractParams(message);
      if (params.intent === "none" || params.intent === undefined) {
        // Ambiguous - use LLM for classification
        params = await extractParams(genAI, message);
      }

      // Reject off-topic queries only after intent extraction
      if (params.intent === "none") {
        return res.json({
          sessionId,
          reply: "I can only help with RentPi related questions such as products, rentals, availability, pricing, and trends.",
        });
      }

      const groundingData = await fetchGroundingData(params, res);
      if (res.headersSent) return;

      const finalPrompt = buildFinalPrompt(message, groundingData);
      const assistantReply = await generateReply(genAI, geminiHistory, finalPrompt);

      await saveConversation(sessionId, message, assistantReply, now);
      res.json({ sessionId, reply: assistantReply });
    } catch (err) {
      console.error("Unexpected error in /chat:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

async function loadGeminiHistory(sessionId: string) {
  try {
    if (!messagesCollection) return [];
    const historyDocs = await messagesCollection.find({ sessionId }).sort({ timestamp: 1 }).toArray();
    return historyDocs.map((doc: any) => ({
      role: doc.role === "assistant" ? "model" : "user",
      parts: [{ text: doc.content }],
    }));
  } catch (err) {
    console.error("DB error fetching history", err);
    return [];
  }
}

async function extractParams(genAI: GoogleGenerativeAI, message: string): Promise<IntentParams> {
  try {
    const extractorPrompt = `You are an intent classifier for RentPi, a rental marketplace.
Extract API parameters from this message: "${message}".
Today's date is ${today()}.
Respond ONLY with JSON. No markdown formatting.

Intents:
- "availability": user asks if a SPECIFIC product is available. Needs productId OR productName AND a date range.
  Example: {"intent": "availability", "productId": 123, "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}
  Example: {"intent": "availability", "productName": "Pro System", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}

- "browse": user asks "is there any X available?" or "show me X products" - they want a list by name/category.
  Example: {"intent": "browse", "searchQuery": "bike"}
  Example: {"intent": "browse", "searchQuery": "portable station"}

- "product_info": user asks "what is/tell me about [product name or ID]" - they want product details.
  Example: {"intent": "product_info", "productId": 7}
  Example: {"intent": "product_info", "productName": "Pro System"}

- "trending": user asks about trending or recommended products for a date.
  Example: {"intent": "trending", "date": "YYYY-MM-DD"}

- "peak": user asks about peak rental period.
  Example: {"intent": "peak", "from": "YYYY-MM", "to": "YYYY-MM"}

- "surge": user asks about surge days for a month.
  Example: {"intent": "surge", "month": "YYYY-MM"}

- "discount": user asks about discount for a user.
  Example: {"intent": "discount", "userId": 42}

- "category": user asks about category stats or which category has most rentals.
  Example: {"intent": "category"}

- "none": the message is completely unrelated to a rental marketplace.

Synonym rules: cycle -> bike, bicycle -> bike, laptop -> electronics, motorbike -> vehicle.
Dates must be strictly YYYY-MM-DD or YYYY-MM. If no date given and availability is needed, use today: ${today()}.`;

    const extModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const extResult = await extModel.generateContent(extractorPrompt);
    const raw = extResult.response.text().trim().replace(/```json|```/gi, "");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Param extraction failed, fallback to keyword", err);
    return fallbackParams(message);
  }
}

function fallbackParams(message: string): IntentParams {
  const lower = message.toLowerCase();
  const id = Number(message.match(/\b\d{2,}\b/)?.[0]);

  // Apply synonym map
  let resolved = lower;
  for (const [syn, canonical] of Object.entries(SYNONYMS)) {
    resolved = resolved.replaceAll(syn, canonical);
  }

  if (lower.includes("category") || lower.includes("stat")) return { intent: "category" };
  if (lower.includes("trending") || lower.includes("recommend")) return { intent: "trending", date: today() };
  if (lower.includes("surge")) return { intent: "surge", month: currentMonth() };
  if (lower.includes("peak")) return { intent: "peak", from: "2024-01", to: "2024-06" };
  if (lower.includes("discount")) {
    return Number.isFinite(id) ? { intent: "discount", userId: id } : { intent: "discount" };
  }
  if (lower.includes("avail") || lower.includes("available") || lower.includes("book")) {
    if (Number.isFinite(id)) return { intent: "availability", productId: id, from: today(), to: today() };
    // Try to extract product name from the message
    const nameMatch = resolved.match(/(?:any|a|an)\s+(.+?)(?:\s+available|\s+avail|\s+for|\?|$)/i);
    if (nameMatch?.[1]) return { intent: "browse", searchQuery: nameMatch[1].trim() };
    return { intent: "browse", searchQuery: resolved.replace(/\?|avail|available|is there any|is there a|can i rent/gi, "").trim() };
  }
  return { intent: "none" };
}


// Fast rule-based extraction - returns intent:"none" only if it can't determine a RentPi intent
// to signal that LLM classification is needed. Returns a valid non-"none" intent for clear cases.
function fastExtractParams(message: string): IntentParams {
  const lower = message.toLowerCase();
  const idMatch = message.match(/\b(\d{2,})\b/);
  const id = idMatch ? Number(idMatch[1]) : NaN;

  // Apply synonym map first
  let resolved = lower;
  for (const [syn, canonical] of Object.entries(SYNONYMS)) {
    resolved = resolved.replaceAll(syn, canonical);
  }

  // Definitive RentPi signals
  if (lower.includes("category") || lower.includes("most rental")) return { intent: "category" };
  if (lower.includes("trending") || lower.includes("recommendation")) return { intent: "trending", date: today() };
  if (lower.includes("surge")) return { intent: "surge", month: currentMonth() };
  if (lower.includes("peak window") || lower.includes("peak period") || lower.includes("peak rental")) {
    return { intent: "peak", from: "2024-01", to: "2024-06" };
  }
  if (lower.includes("discount")) {
    return Number.isFinite(id) ? { intent: "discount", userId: id } : { intent: "discount" };
  }

  // Availability / Browse detection
  const hasAvailWord = /\bavail|available|available\b|book/i.test(lower);
  if (hasAvailWord) {
    if (Number.isFinite(id)) {
      // Specific product ID
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
      const d = dateMatch?.[1] || today();
      return { intent: "availability", productId: id, from: d, to: d };
    }
    // Extract noun after "any" / "a" / "an"
    const nameMatch = resolved.match(/(?:any|a|an)\s+(.+?)(?:\s+avail|\?|$)/i);
    const q = (nameMatch?.[1] || resolved)
      .replace(/\?|availale|available|avail|is there|can i rent|for april|for may|for \d{4}/gi, "")
      .trim();
    if (q) return { intent: "browse", searchQuery: q };
  }

  // Product info queries
  if (/know about|tell me about|what is|what do you know|info|details/i.test(lower)) {
    if (Number.isFinite(id)) return { intent: "product_info", productId: id };
    // Extract name fragment
    const nameMatch = lower.match(/(?:about|is|what is)\s+(.+?)(?:\s*\?|$)/i);
    if (nameMatch?.[1]) return { intent: "product_info", productName: nameMatch[1].trim() };
  }

  // Generic "is there any X?" or "show me X"
  if (/is there any|show me|find me|looking for|need a|need an/i.test(lower)) {
    const nameMatch = resolved.match(/(?:there any|me|for)\s+(.+?)(?:\?|$)/i);
    if (nameMatch?.[1]) return { intent: "browse", searchQuery: nameMatch[1].trim() };
  }

  // Can't determine - fall through to LLM
  return { intent: "none" };
}


async function fetchGroundingData(params: IntentParams, res: Response) {
  try {
    return await loadGroundingData(params);
  } catch (err: any) {
    if (err.message === "429_EXHAUSTED") {
      res.status(503).json({
        error: "Central API unavailable after 3 retries",
        lastRetryAfter: err.lastRetryAfter,
        suggestion: "Try again in ~2 minutes",
      });
      return null;
    }

    console.error("Error fetching grounding data", err);
    return null;
  }
}

async function loadGroundingData(params: IntentParams) {
  if (params.intent === "category") return fetchJson(`${config.CENTRAL_API_URL}/api/data/rentals/stats?group_by=category`, true);
  if (params.intent === "availability") return fetchAvailability(params);
  if (params.intent === "browse") return fetchBrowse(params);
  if (params.intent === "product_info") return fetchProductInfo(params);
  if (params.intent === "trending") {
    const date = params.date || today();
    return fetchJson(`${config.ANALYTICS_SERVICE_URL}/analytics/recommendations?date=${date}&limit=5`);
  }
  if (params.intent === "surge") {
    return fetchJson(`${config.ANALYTICS_SERVICE_URL}/analytics/surge-days?month=${params.month || currentMonth()}`);
  }
  if (params.intent === "peak") {
    const from = params.from || "2024-01";
    const to = params.to || "2024-06";
    return fetchJson(`${config.ANALYTICS_SERVICE_URL}/analytics/peak-window?from=${from}&to=${to}`);
  }
  if (params.intent === "discount") return fetchDiscount(params);

  return null;
}

async function fetchBrowse(params: IntentParams) {
  const q = resolveSynonyms(params.searchQuery || "");
  if (!q) return { message: "No search query provided." };

  const searchUrl = `${config.ANALYTICS_SERVICE_URL}/analytics/search?q=${encodeURIComponent(q)}`;
  const searchResp = await fetchWithCache(searchUrl);
  if (!searchResp.ok) return { message: "Could not search products." };

  const searchData = await searchResp.json();
  const results = searchData.results || [];
  if (results.length === 0) {
    return { message: `No products found matching "${q}".` };
  }
  return { searchQuery: q, matchingProducts: results };
}

async function fetchProductInfo(params: IntentParams) {
  let productId = params.productId;

  if (!productId && params.productName) {
    const q = resolveSynonyms(params.productName);
    const searchResp = await fetchWithCache(`${config.ANALYTICS_SERVICE_URL}/analytics/search?q=${encodeURIComponent(q)}`);
    if (searchResp.ok) {
      const data = await searchResp.json();
      if (data.results?.length > 0) productId = data.results[0].id;
    }
  }

  if (!productId) return { message: "Product not found. Please provide a product name or ID." };

  const resp = await fetchWithCache(`${config.RENTAL_SERVICE_URL}/rentals/products/${productId}`);
  return resp.ok ? resp.json() : { message: "Product not found." };
}

async function fetchAvailability(params: IntentParams) {
  let productId = params.productId;
  let productInfo: any = null;

  // Resolve name to ID if ID is missing
  if (!productId && params.productName) {
    const q = resolveSynonyms(params.productName);
    const searchResp = await fetchWithCache(`${config.ANALYTICS_SERVICE_URL}/analytics/search?q=${encodeURIComponent(q)}`);
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData.results?.length > 0) {
        productInfo = searchData.results[0];
        productId = productInfo.id;
      }
    }
  }

  if (!productId) {
    // Fall back to browse if no specific product could be resolved
    if (params.productName) return fetchBrowse({ intent: "browse", searchQuery: params.productName });
    return { message: "Please provide a product name or ID to check availability." };
  }

  // Fetch product details
  if (!productInfo) {
    const infoResp = await fetchWithCache(`${config.RENTAL_SERVICE_URL}/rentals/products/${productId}`);
    if (infoResp.ok) productInfo = await infoResp.json();
  }

  const from = params.from || today();
  const to = params.to || today();
  const availability = await fetchJson(`${config.RENTAL_SERVICE_URL}/rentals/products/${productId}/availability?from=${from}&to=${to}`);

  return { product: productInfo, availability };
}

async function fetchDiscount(params: IntentParams) {
  if (!params.userId) {
    return { message: "Please provide a user ID to check discount eligibility." };
  }
  return fetchJson(`${config.CENTRAL_API_URL}/api/data/users/${params.userId}`, true);
}

function resolveSynonyms(query: string): string {
  let q = query.toLowerCase();
  for (const [syn, canonical] of Object.entries(SYNONYMS)) {
    q = q.replaceAll(syn, canonical);
  }
  return q;
}

async function fetchJson(url: string, authorized = false) {
  const options = authorized ? { headers: { Authorization: `Bearer ${config.CENTRAL_API_TOKEN}` } } : undefined;
  const resp = await fetchWithCache(url, options);
  return resp.ok ? resp.json() : null;
}

function buildFinalPrompt(message: string, groundingData: unknown) {
  if (!groundingData) {
    return `[NO DATA AVAILABLE]
You have no grounding data. If the question requires factual data (prices, availability, stats), state that the data is currently unavailable. Do NOT guess.

User Question: ${message}`;
  }

  return `[REAL PLATFORM DATA]
${JSON.stringify(groundingData, null, 2)}
[END OF DATA]

Using ONLY the data above, answer this question. Mention product names, categories, and prices where available:
${message}`;
}

async function generateReply(genAI: GoogleGenerativeAI, history: any[], finalPrompt: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
      generationConfig: { temperature: 0.1 },
    });
    const result = await model.startChat({ history }).sendMessage(finalPrompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "I'm having trouble fetching data right now. Please try again shortly.";
  }
}

async function saveConversation(sessionId: string, message: string, assistantReply: string, now: Date) {
  try {
    if (!messagesCollection || !sessionsCollection) return;

    await messagesCollection.insertMany([
      { sessionId, role: "user", content: message, timestamp: now },
      { sessionId, role: "assistant", content: assistantReply, timestamp: new Date() },
    ]);

    const session = await sessionsCollection.findOne({ sessionId });
    if (!session) {
      await sessionsCollection.insertOne({
        sessionId,
        name: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
        createdAt: now,
        lastMessageAt: new Date(),
      });
      return;
    }

    await sessionsCollection.updateOne({ sessionId }, { $set: { lastMessageAt: new Date() } });
  } catch (err) {
    console.error("DB Error saving messages/session:", err);
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  return new Date().toISOString().substring(0, 7);
}
