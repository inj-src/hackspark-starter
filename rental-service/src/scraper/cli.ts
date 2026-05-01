import "dotenv/config";
import path from "node:path";
import { createScraperRuntime } from "./runner.js";

async function main() {
  const mode = process.argv[2] ?? "loop";
  const cacheDir = process.env.RENTAL_CACHE_DIR ?? path.join(process.cwd(), "..", "cache");
  const runtime = await createScraperRuntime(cacheDir);

  if (mode === "once") {
    await runtime.runOnce();
    console.log("[scraper] finished one pass");
    return;
  }

  console.log("[scraper] starting continuous loop");
  await runtime.startLoop();
}

main().catch((err) => {
  console.error("[scraper] fatal", err);
  process.exit(1);
});
