const express = require('express');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
let db, sessionsCollection, messagesCollection;

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

// Keywords guard
const RENTPI_KEYWORDS = [
  "rental", "product", "category", "price", "discount", "available", "availability",
  "renter", "owner", "rentpi", "booking", "gear", "surge", "peak", "trending", "rent"
];

function isOnTopic(message) {
  const lower = message.toLowerCase();
  return RENTPI_KEYWORDS.some(kw => lower.includes(kw));
}

// Routes
app.get('/status', (req, res) => {
  res.json({ service: 'agentic-service', status: 'OK' });
});

app.post('/chat', async (req, res) => {
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
    let historyDocs = [];
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
    let groundingData = null;
    const lowerMessage = message.toLowerCase();

    try {
      if (lowerMessage.includes("category") || lowerMessage.includes("most rented") || lowerMessage.includes("category stats")) {
        const url = `${CENTRAL_API_URL}/api/data/rentals/stats?group_by=category`;
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${CENTRAL_API_TOKEN}` } });
        if (resp.ok) groundingData = await resp.json();
      }
      else if (lowerMessage.includes("available") || lowerMessage.includes("availability") || lowerMessage.includes("book") || lowerMessage.includes("free")) {
        const match = message.match(/\b\d+\b/);
        const productId = match ? match[0] : 1;
        const url = `${RENTAL_SERVICE_URL}/rentals/products/${productId}/availability?from=2024-01-01&to=2024-12-31`;
        const resp = await fetch(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (lowerMessage.includes("trending") || lowerMessage.includes("recommend") || lowerMessage.includes("season") || lowerMessage.includes("right now")) {
        const today = new Date().toISOString().split('T')[0];
        const url = `${ANALYTICS_SERVICE_URL}/analytics/recommendations?date=${today}&limit=5`;
        const resp = await fetch(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (lowerMessage.includes("surge") || lowerMessage.includes("spike") || lowerMessage.includes("surge day")) {
        const month = new Date().toISOString().substring(0, 7);
        const url = `${ANALYTICS_SERVICE_URL}/analytics/surge-days?month=${month}`;
        const resp = await fetch(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (lowerMessage.includes("peak") || lowerMessage.includes("busiest week") || lowerMessage.includes("7 day") || lowerMessage.includes("rush")) {
        const url = `${ANALYTICS_SERVICE_URL}/analytics/peak-window?from=2024-01&to=2024-06`;
        const resp = await fetch(url);
        if (resp.ok) groundingData = await resp.json();
      }
      else if (lowerMessage.includes("discount") || lowerMessage.includes("security score") || lowerMessage.includes("loyalty")) {
        const match = message.match(/\b\d+\b/);
        const userId = match ? match[0] : 1;
        const url = `${CENTRAL_API_URL}/api/data/users/${userId}`;
        const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${CENTRAL_API_TOKEN}` } });
        if (resp.ok) groundingData = await resp.json();
      }
    } catch (err) {
      console.error("Error fetching grounding data", err);
      groundingData = null;
    }

    // Step 4: Build LLM Prompt
    const systemInstruction = `You are RentPi Assistant, an AI chatbot for the RentPi rental marketplace platform.
You help users with questions about products, rentals, availability, pricing, discounts, categories, and trends.
You ONLY answer questions related to RentPi. Politely refuse anything unrelated.
CRITICAL RULE: Only use the data explicitly provided to you in this prompt. Never invent numbers, dates, or product names. If data is not provided or unavailable, say so honestly.
Keep answers concise and helpful.`;

    let finalPrompt = message;
    if (groundingData) {
      finalPrompt = `[REAL DATA FROM RENTPI PLATFORM]
${JSON.stringify(groundingData, null, 2)}
[END OF DATA]

Using only the data above, answer this question:
${message}`;
    }

    // Step 5: Call Gemini
    let assistantReply = "";
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction
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

app.get('/chat/sessions', async (req, res) => {
  try {
    if (!sessionsCollection) return res.json({ sessions: [] });
    const sessions = await sessionsCollection.find({}).sort({ lastMessageAt: -1 }).toArray();
    res.json({
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        name: s.name,
        lastMessageAt: s.lastMessageAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/chat/:sessionId/history', async (req, res) => {
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
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/chat/:sessionId', async (req, res) => {
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
