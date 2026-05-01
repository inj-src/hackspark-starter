import { Collection, Db, MongoClient } from "mongodb";
import { config } from "./config";

let db: Db | undefined;
export let sessionsCollection: Collection | undefined;
export let messagesCollection: Collection | undefined;

export async function setupDb() {
  try {
    const client = new MongoClient(config.MONGO_URI);
    await client.connect();

    db = client.db(config.MONGO_DB);
    sessionsCollection = db.collection("sessions");
    messagesCollection = db.collection("messages");

    await sessionsCollection.createIndex({ sessionId: 1 }, { unique: true });
    await sessionsCollection.createIndex({ lastMessageAt: -1 });
    await messagesCollection.createIndex({ sessionId: 1 });
    await messagesCollection.createIndex({ timestamp: 1 });

    console.log("Connected to MongoDB and initialized indexes");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}
