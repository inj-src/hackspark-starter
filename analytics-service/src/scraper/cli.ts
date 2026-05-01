import "dotenv/config";
import path from "node:path";
import { createScraperRuntime } from "./runner.js";

async function main() {
  const command = process.argv[2] ?? "once";
  const cacheDir = process.env.ANALYTICS_CACHE_DIR ?? path.join(process.cwd(), "cache");
  const runtime = await createScraperRuntime(cacheDir);

  if (command === "loop") {
    await runtime.startLoop();
    return;
  }

  await runtime.runOnce();
}

main().catch((err) => {
  console.error("[analytics-scraper] failed", err);
  process.exit(1);
});
