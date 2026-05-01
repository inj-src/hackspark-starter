import { Express, Request, Response } from "express";
import { messagesCollection, sessionsCollection } from "./db";

export function registerSessionRoutes(app: Express) {
  const listSessions = async (_req: Request, res: Response): Promise<any> => {
    try {
      if (!sessionsCollection) return res.json({ sessions: [] });

      const sessions = await sessionsCollection.find({}).sort({ lastMessageAt: -1 }).toArray();
      res.json({
        sessions: sessions.map((s: any) => ({
          sessionId: s.sessionId,
          name: s.name,
          lastMessageAt: s.lastMessageAt,
        })),
      });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  };

  const getSessionHistory = async (req: Request, res: Response): Promise<any> => {
    const { sessionId } = req.params;

    try {
      if (!sessionsCollection || !messagesCollection) {
        return res.status(500).json({ error: "DB not connected" });
      }

      const session = await sessionsCollection.findOne({ sessionId });
      if (!session) return res.status(404).json({ error: "Session not found" });

      const messages = await messagesCollection.find({ sessionId }).sort({ timestamp: 1 }).toArray();
      res.json({
        sessionId: session.sessionId,
        name: session.name,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      });
    } catch (_err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  };

  const deleteSession = async (req: Request, res: Response): Promise<any> => {
    const { sessionId } = req.params;

    try {
      if (!sessionsCollection || !messagesCollection) {
        return res.status(500).json({ error: "DB not connected" });
      }

      const result = await sessionsCollection.deleteOne({ sessionId });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Session not found" });

      await messagesCollection.deleteMany({ sessionId });
      res.json({ deleted: true });
    } catch (_err) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  };

  app.get("/chat/sessions", listSessions);
  app.get("/chat/:sessionId/history", getSessionHistory);
  app.delete("/chat/:sessionId", deleteSession);

  // Aliases for gateway /sessions prefix support.
  app.get("/sessions", listSessions);
  app.get("/sessions/:sessionId/history", getSessionHistory);
  app.delete("/sessions/:sessionId", deleteSession);
}
