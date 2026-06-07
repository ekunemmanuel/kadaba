// src/index.ts   (the file Vercel will run)
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { documentsRoutes } from "./routes/documents";
import { emailRoutes } from "./routes/email";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";
const app = new Elysia()
  .use(
    cors({
      origin: ALLOWED_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .get("/", () => "Hello from Bun + Elysia on Vercel!")
  .get("/api/health", () => ({
    status: "ok",
    service: "Kadaba Document Generator",
    version: "2.0.0",
    runtime: "Bun",
    timestamp: new Date().toISOString(),
  }))
  // ── API sub‑router (prefix = /api)
  .group("/api", (app) => app.use(documentsRoutes).use(emailRoutes));
// **Never call .listen()** – Vercel will invoke the exported handler.
export default app;