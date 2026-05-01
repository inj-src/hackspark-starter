import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import { config } from "./config";
import { messagesCollection, sessionsCollection } from "./db";
import { fetchWithCache } from "./fetchWithCache";
import { buildFallbackReply } from "./replyFallback";

export type IntentParams = {
  intent: "availability" | "peak" | "surge" | "trending" | "discount" | "category" | "none";
  productId?: number;
  productName?: string;
  userId?: number;
  from?: string;
  to?: string;
  month?: string;
  date?: string;
};

const RENTPI_KEYWORDS = [
  "rental",
  "product",
  "category",
  "price",
  "discount",
  "available",
  "availability",
  "renter",
  "owner",
  "rentpi",
  "booking",
  "gear",
  "surge",
  "peak",
  "trending",
  "rent",
];

const systemInstruction = `You are RentPi Assistant, a professional and direct AI for the RentPi rental marketplace.
Rules:
1. NO GREETINGS OR FILLER. Do not say "Hello", "Hi", "I'd be happy to help", "Sure", or any other introductory phrases. Start answering the user's question immediately.
2. Be extremely concise, factual, and to the point.
3. ONLY answer questions related to RentPi.
4. Only use the provided factual data. Do not invent details.
5. If data is missing (e.g., product ID), ask for it briefly.
6. For lists or recommendations, use a short, direct paragraph mentioning names and categories.`;

export function createChatHandler(genAI: GoogleGenerativeAI) {
  return async (req: Request, res: Response): Promise<any> => {
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    if (sessionId.length > 128) {
      return res.status(400).json({ error: "sessionId is too long" });
    }

    if (!isOnTopic(message)) {
      const now = new Date();
      const reply =
        "I can only help with RentPi related questions such as products, rentals, availability, pricing, and trends.";
      await saveConversation(genAI, sessionId, message, reply, now);
      return res.json({
        sessionId,
        reply,
      });
    }

    try {
      const now = new Date();
      const geminiHistory = await loadGeminiHistory(sessionId);
      const params = await extractParams(genAI, message);
      const groundingData = await fetchGroundingData(params, res);
      if (res.headersSent) return;

      const finalPrompt = buildFinalPrompt(message, groundingData);
      const fallbackReply = buildFallbackReply(params, groundingData);
      const assistantReply = await generateReply(genAI, geminiHistory, finalPrompt, fallbackReply);

      await saveConversation(genAI, sessionId, message, assistantReply, now);
      res.json({ sessionId, reply: assistantReply });
    } catch (err) {
      console.error("Unexpected error in /chat:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

function isOnTopic(message: string) {
  const lower = message.toLowerCase();
  return RENTPI_KEYWORDS.some((kw) => lower.includes(kw));
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
    const extractorPrompt = `Extract API parameters from this message: "${message}".
Today's date is ${today()}.
Respond ONLY with JSON. No markdown formatting.
Format:
- Product availability: {"intent": "availability", "productId": 123, "productName": "name", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"} (Omit productId/productName if not mentioned)
- Peak period: {"intent": "peak", "from": "YYYY-MM", "to": "YYYY-MM"}
- Surge days: {"intent": "surge", "month": "YYYY-MM"}
- Trending: {"intent": "trending", "date": "YYYY-MM-DD"}
- Discount/User: {"intent": "discount", "userId": 123} (Omit userId if not mentioned)
- Category stats: {"intent": "category"}
- Otherwise: {"intent": "none"}
Make sure dates are strictly formatted.`;

    const extModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const extResult = await extModel.generateContent(extractorPrompt);
    return JSON.parse(extResult.response.text().trim().replace(/```json|```/gi, ""));
  } catch (err) {
    console.error("Param extraction failed, fallback to keyword", err);
    return fallbackParams(message);
  }
}

function fallbackParams(message: string): IntentParams {
  const lowerMessage = message.toLowerCase();
  const id = Number(message.match(/\b\d+\b/)?.[0]);

  if (lowerMessage.includes("category")) return { intent: "category" };
  if (lowerMessage.includes("available")) {
    return Number.isFinite(id) ? { intent: "availability", productId: id } : { intent: "availability" };
  }
  if (lowerMessage.includes("trending")) return { intent: "trending", date: today() };
  if (lowerMessage.includes("surge")) return { intent: "surge", month: currentMonth() };
  if (lowerMessage.includes("peak")) return { intent: "peak", from: "2024-01", to: "2024-06" };
  if (lowerMessage.includes("discount")) {
    return Number.isFinite(id) ? { intent: "discount", userId: id } : { intent: "discount" };
  }

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

async function fetchAvailability(params: IntentParams) {
  let productId = params.productId;
  let productInfo: any = null;

  // Attempt to resolve name to ID if ID is missing
  if (!productId && params.productName) {
    const searchUrl = `${config.ANALYTICS_SERVICE_URL}/analytics/search?q=${encodeURIComponent(params.productName)}`;
    const searchResp = await fetchWithCache(searchUrl);
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData.results && searchData.results.length > 0) {
        productInfo = searchData.results[0];
        productId = productInfo.id;
      }
    }
  }

  if (!productId) {
    return {
      system_note: "The user did not provide a valid product ID or the name could not be resolved. Ask them for the product ID so you can check availability.",
    };
  }

  // Fetch product info if we don't have it yet
  if (!productInfo) {
    const infoUrl = `${config.RENTAL_SERVICE_URL}/rentals/products/${productId}`;
    const infoResp = await fetchWithCache(infoUrl);
    if (infoResp.ok) {
      productInfo = await infoResp.json();
    }
  }

  const from = params.from || "2024-01-01";
  const to = params.to || "2024-12-31";
  const availabilityUrl = `${config.RENTAL_SERVICE_URL}/rentals/products/${productId}/availability?from=${from}&to=${to}`;
  const availability = await fetchJson(availabilityUrl);

  return {
    product: productInfo,
    availability: availability
  };
}

async function fetchDiscount(params: IntentParams) {
  if (!params.userId) {
    return {
      system_note: "The user did not provide a valid user ID. Ask them for the user ID so you can check discount eligibility.",
    };
  }

  return fetchJson(`${config.CENTRAL_API_URL}/api/data/users/${params.userId}`, true);
}

async function fetchJson(url: string, authorized = false) {
  const options = authorized ? { headers: { Authorization: `Bearer ${config.CENTRAL_API_TOKEN}` } } : undefined;
  const resp = await fetchWithCache(url, options);
  return resp.ok ? resp.json() : null;
}

function buildFinalPrompt(message: string, groundingData: unknown) {
  if (!groundingData) {
    return `[NO DATA AVAILABLE]
You currently have NO grounding data for this request. If the user's question requires factual data from the platform (like prices, availability, stats, categories, etc.), you MUST explicitly state that the data is currently unavailable. Do NOT guess or invent numbers.

User Question: ${message}`;
  }

  return `[REAL DATA OR SYSTEM NOTE]
${JSON.stringify(groundingData, null, 2)}
[END OF DATA]

Using ONLY the data or instructions above, answer this question naturally. Do not invent details not present in the data:
${message}`;
}

async function generateReply(genAI: GoogleGenerativeAI, history: any[], finalPrompt: string, fallbackReply: string) {
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
    return fallbackReply;
  }
}

async function saveConversation(
  genAI: GoogleGenerativeAI,
  sessionId: string,
  message: string,
  assistantReply: string,
  now: Date,
) {
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
        name: await generateSessionTitle(genAI, message),
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

async function generateSessionTitle(genAI: GoogleGenerativeAI, message: string) {
  try {
    const titleModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const titlePrompt = `Give a short 3-5 word title for a chat conversation that starts with this message: "${message}". Reply with ONLY the title. No punctuation, no quotes.`;
    const titleResult = await titleModel.generateContent(titlePrompt);
    return titleResult.response.text().trim().replace(/['"]/g, "");
  } catch (err) {
    console.error("Error generating session title:", err);
    return "New Chat";
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  return new Date().toISOString().substring(0, 7);
}
