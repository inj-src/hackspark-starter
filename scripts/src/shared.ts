import path from "node:path";

export type ScraperMode = "once" | "loop";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function resolveRepoCacheDir(envVar: string): string {
  return path.resolve(process.env[envVar] ?? path.join(process.cwd(), "..", "cache"));
}

export function requireCentralConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.CENTRAL_API_URL;
  const token = process.env.CENTRAL_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("CENTRAL_API_URL and CENTRAL_API_TOKEN are required to run scraper");
  }
  return { baseUrl, token };
}
