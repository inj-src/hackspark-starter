import express, { Request, Response } from 'express';
import { MongoClient, Db, Collection } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017';
const MONGO_DB = process.env.MONGO_DB || 'rentpi_chat';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CENTRAL_API_URL = process.env.CENTRAL_API_URL || 'https://technocracy.brittoo.xyz';
const CENTRAL_API_TOKEN = process.env.CENTRAL_API_TOKEN;
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:8003';
const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL || 'http://rental-service:8002';

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'dummy_key');
let db: Db;
let sessionsCollection: Collection;
let messagesCollection: Collection;

// Setup MongoDB connection
async function setupDb() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(MONGO_DB);
    sessionsCollection = db.collection('sessions');
    messagesCollection = db.collection('messages');

    // Create Indexes
    await sessionsCollection.createIndex({ sessionId: 1 }, { unique: true });
    await sessionsCollection.createIndex({ lastMessageAt: -1 });
    await messagesCollection.createIndex({ sessionId: 1 });
    await messagesCollection.createIndex({ timestamp: 1 });

    console.log('Connected to MongoDB and initialized indexes');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

setupDb();

// In-Memory Cache for API responses
const memoryCache = new Map<string, { timestamp: number, data: any }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

async function fetchWithCache(url: string, options: any = {}) {
  const cacheKey = url + (options.headers ? JSON.stringify(options.headers) : '');
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Cache Hit] ${url}`);
      return { ok: true, json: async () => cached.data };
    }
    memoryCache.delete(cacheKey);
  }

  console.log(`[Cache Miss] ${url}`);
  let attempt = 0;
  const maxRetries = 3;
  let lastRetryAfter = 72;

  while (attempt <= maxRetries) {
    const resp = await fetch(url, options);
    
    if (resp.status === 429) {
      if (attempt === maxRetries) {
        throw { message: "429_EXHAUSTED", lastRetryAfter };
      }
      
      let retryAfterSeconds = 10;
      try {
        const body = await resp.json();
        retryAfterSeconds = body.retryAfterSeconds || 10;
      } catch(e) {}
      
      lastRetryAfter = retryAfterSeconds;
      
      let backoff = retryAfterSeconds * Math.pow(2, attempt);
      const jitter = backoff * 0.2;
      backoff = backoff + (Math.random() * 2 * jitter - jitter);
      
      console.log(`[retry ${attempt + 1}/${maxRetries}] waiting ${Math.round(backoff)}s before retrying GET ${url}`);
      
      await new Promise(resolve => setTimeout(resolve, backoff * 1000));
      attempt++;
      continue;
    }
    
    if (resp.ok) {
      const data = await resp.json();
      memoryCache.set(cacheKey, { timestamp: Date.now(), data });
      return { ok: true, json: async () => data };
    }
    return resp;
  }
  return { ok: false, json: async () => ({}) };
}

// Keywords guard
const RENTPI_KEYWORDS = [
  "rental", "product", "category", "price", "discount", "available", "availability",
  "renter", "owner", "rentpi", "booking", "gear", "surge", "peak", "trending", "rent"
];

function isOnTopic(message: string) {
  const lower = message.toLowerCase();
  return RENTPI_KEYWORDS.some(kw => lower.includes(kw));
}

// Routes
app.get('/status', (req: Request, res: Response) => {
  res.json({ service: 'agentic-service', status: 'OK' });
});

app.post('/chat', async (req: Request, res: Response): Promise<any> => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  // Step 1: Keyword Guard
  if (!isOnTopic(message)) {
    return res.json({ 
      sessionId, 
      reply: "I can only help with RentPi related questions such as products, rentals, availability, pricing, and trends." 
    });
  }

  try {
    const now = new Date();

    // Step 2: Load chat history
    let historyDocs: any[] = [];
    try {
      if (messagesCollection) {
        historyDocs = await messagesCollection.find({ sessionId }).sort({ timestamp: 1 }).toArray();
      }
    } catch (err) {
      console.error("DB error fetching history", err);
    }

    const geminiHistory = historyDocs.map(doc => ({
      role: doc.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: doc.content }]
    }));

    // Step 3: Intent & Grounding Data
    let groundingData: any = null;
    let params: any = { intent: "none" };
    
    try {
        const extractorPrompt = `Extract API parameters from this message: "${message}". 
Today's date is ${new Date().toISOString().split('T')[0]}.
Respond ONLY with JSON. No markdown formatting.
Format:
- Product availability: {"intent": "availability", "productId": 123, "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"} (Omit productId if not mentioned)
- Peak period: {"intent": "peak", "from": "YYYY-MM", "to": "YYYY-MM"}
- Surge days: {"intent": "surge", "month": "YYYY-MM"}
- Trending: {"intent": "trending", "date": "YYYY-MM-DD"}
- Discount/User: {"intent": "discount", "userId": 123} (Omit userId if not mentioned)
- Category stats: {"intent": "category"}
- Otherwise: {"intent": "none"}
Make sure dates are strictly formatted.`;

        const extModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const extResult = await extModel.generateContent(extractorPrompt);
        params = JSON.parse(extResult.response.text().trim().replace(/```json|```/gi, ''));
    } catch(e) {
        console.error("Param extraction failed, fallback to keyword", e);
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes("category")) params.intent = "category";
        else if (lowerMessage.includes("available")) params = { intent: "availability", productId: 1, from: "2024-01-01", to: "2024-12-31" };
        else if (lowerMessage.includes("trending")) params = { intent: "trending", date: new Date().toISOString().split('T')[0] };
        else if (lowerMessage.includes("surge")) params = { intent: "surge", month: new Date().toISOString().substring(0, 7) };
        else if (lowerMessage.includes("peak")) params = { intent: "peak", from: "2024-01", to: "2024-06" };
        else if (lowerMessage.includes("discount")) params = { intent: "discount", userId: 1 };
    }

    try {
      if (params.intent === "category") {
        const url = `${CENTRAL_API_URL}/api/data/rentals/stats?group_by=category`;
        const resp = await fetchWithCache(url, { headers: { 'Authorization': `Bearer ${CENTRAL_API_TOKEN}` } });
        if (resp.ok) groundingData = await resp.json();
      } 
      else if (params.intent === "availability") {
        // Space for future gRPC implementation with rental-service
        if (!params.productId) {
          groundingData = { system_note: "The user did not provide a valid product ID. Please warmly ask them for the product ID so you can check its availability." };
        } else {
          const url = `${RENTAL_SERVICE_URL}/rentals/products/${params.productId}/availability?from=${params.from || '2024-01-01'}&to=${params.to || '2024-12-31'}`;
          const resp = await fetchWithCache(url);
          if (resp.ok) groundingData = await resp.json();
        }
      }
      else if (params.intent === "trending") {
        const url = `${ANALYTICS_SERVICE_URL}/analytics/recommendations?date=${params.date || new Date().toISOString().split('T')[0]}&limit=5`;
        const resp = await fetchWithCache(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (params.intent === "surge") {
        const url = `${ANALYTICS_SERVICE_URL}/analytics/surge-days?month=${params.month || new Date().toISOString().substring(0, 7)}`;
        const resp = await fetchWithCache(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (params.intent === "peak") {
        const url = `${ANALYTICS_SERVICE_URL}/analytics/peak-window?from=${params.from || '2024-01'}&to=${params.to || '2024-06'}`;
        const resp = await fetchWithCache(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (params.intent === "discount") {
        const url = `${CENTRAL_API_URL}/api/data/users/${params.userId || 1}`;
        const resp = await fetchWithCache(url, { headers: { 'Authorization': `Bearer ${CENTRAL_API_TOKEN}` } });
        if (resp.ok) groundingData = await resp.json();
      }
    } catch (err: any) {
      if (err.message === "429_EXHAUSTED") {
        return res.status(503).json({
          error: "Central API unavailable after 3 retries",
          lastRetryAfter: err.lastRetryAfter,
          suggestion: "Try again in ~2 minutes"
        });
      }
      console.error("Error fetching grounding data", err);
      groundingData = null;
    }

    // Step 4: Build LLM Prompt
    const systemInstruction = `You are RentPi Assistant, a friendly, enthusiastic, and conversational AI for the RentPi rental marketplace.
You help users with questions about products, rentals, availability, pricing, discounts, categories, and trends.
Tone: Warm, human, and engaging. Speak as if you are a knowledgeable guide.
Rules:
1. ONLY answer questions related to RentPi. Politely refuse anything unrelated.
2. Only use the factual data provided in the prompt. Do not invent numbers or dates.
3. If data is missing (like a product ID), politely ask the user for it.
4. When listing products or recommendations, DO NOT just output a bulleted list of IDs. Write a short, engaging paragraph describing the items as great finds, mentioning their names, categories, and why they are popular. Make it sound appealing!`;

    let finalPrompt = message;
    if (groundingData) {
      finalPrompt = `[REAL DATA OR SYSTEM NOTE]
${JSON.stringify(groundingData, null, 2)}
[END OF DATA]

Using ONLY the data or instructions above, answer this question naturally. Do not invent details not present in the data:
${message}`;
    } else {
      finalPrompt = `[NO DATA AVAILABLE]
You currently have NO grounding data for this request. If the user's question requires factual data from the platform (like prices, availability, stats, categories, etc.), you MUST explicitly state that the data is currently unavailable. Do NOT guess or invent numbers.

User Question: ${message}`;
    }

    // Step 5: Call Gemini
    let assistantReply = "";
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction,
        generationConfig: { temperature: 0.7 } // Increased temperature for maximum natural tone
      });
      
      const chat = model.startChat({
        history: geminiHistory,
      });

      const result = await chat.sendMessage(finalPrompt);
      assistantReply = result.response.text();
    } catch (err) {
      console.error("Gemini API Error:", err);
      assistantReply = "I'm having trouble fetching data right now. Please try again shortly.";
    }

    // Step 6: Save to MongoDB
    try {
      if (messagesCollection && sessionsCollection) {
        await messagesCollection.insertMany([
          { sessionId, role: "user", content: message, timestamp: now },
          { sessionId, role: "assistant", content: assistantReply, timestamp: new Date() }
        ]);

        const session = await sessionsCollection.findOne({ sessionId });
        if (!session) {
          let sessionName = "New Chat";
          try {
            const titleModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const titlePrompt = `Give a short 3-5 word title for a chat conversation that starts with this message: "${message}". Reply with ONLY the title. No punctuation, no quotes.`;
            const titleResult = await titleModel.generateContent(titlePrompt);
            sessionName = titleResult.response.text().trim().replace(/['"]/g, '');
          } catch (err) {
            console.error("Error generating session title:", err);
          }

          await sessionsCollection.insertOne({
            sessionId,
            name: sessionName,
            createdAt: now,
            lastMessageAt: new Date()
          });
        } else {
          await sessionsCollection.updateOne(
            { sessionId },
            { $set: { lastMessageAt: new Date() } }
          );
        }
      }
    } catch (err) {
      console.error("DB Error saving messages/session:", err);
    }

    // Step 7: Return Response
    res.json({ sessionId, reply: assistantReply });

  } catch (err) {
    console.error("Unexpected error in /chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/chat/sessions', async (req: Request, res: Response): Promise<any> => {
  try {
    if (!sessionsCollection) return res.json({ sessions: [] });
    const sessions = await sessionsCollection.find({}).sort({ lastMessageAt: -1 }).toArray();
    res.json({
      sessions: sessions.map((s: any) => ({
        sessionId: s.sessionId,
        name: s.name,
        lastMessageAt: s.lastMessageAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/chat/:sessionId/history', async (req: Request, res: Response): Promise<any> => {
  const { sessionId } = req.params;
  try {
    if (!sessionsCollection || !messagesCollection) return res.status(500).json({ error: 'DB not connected' });
    
    const session = await sessionsCollection.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await messagesCollection.find({ sessionId }).sort({ timestamp: 1 }).toArray();
    
    res.json({
      sessionId: session.sessionId,
      name: session.name,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/chat/:sessionId', async (req: Request, res: Response): Promise<any> => {
  const { sessionId } = req.params;
  try {
    if (!sessionsCollection) return res.status(500).json({ error: 'DB not connected' });
    const result = await sessionsCollection.deleteOne({ sessionId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await messagesCollection.deleteMany({ sessionId });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.listen(PORT, () => {
  console.log(`Agentic service running on port ${PORT}`);
});
