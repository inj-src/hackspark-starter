import { Hono } from "hono";

export const statusRoute = new Hono();

statusRoute.get("/status", (c) => {
  return c.json({ service: "rental-service", status: "OK" });
});
