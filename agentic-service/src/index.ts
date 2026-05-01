import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config";
import { setupDb } from "./db";
import { createChatHandler } from "./chat";
import { registerSessionRoutes } from "./sessionRoutes";

const app = express();
app.use(express.json());

if (!config.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || "dummy_key");

setupDb();

app.get("/status", (_req: Request, res: Response) => {
  res.json({ service: "agentic-service", status: "OK" });
});

app.post("/chat", createChatHandler(genAI));
registerSessionRoutes(app);

app.listen(config.PORT, () => {
  console.log(`Agentic service running on port ${config.PORT}`);
});
