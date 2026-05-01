import { Hono } from "hono";

export const statusRoute = new Hono();

statusRoute.get("/status", (c) => c.json({ service: "analytics-service", status: "OK" }));
