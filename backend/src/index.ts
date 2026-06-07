// src/app.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { documentsRoutes } from "./routes/documents.ts";
import { emailRoutes } from "./routes/email.ts";
const PORT = Number(process.env.PORT ?? 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";
const app = new Elysia()
  // ── CORS (uncomment for production) ───────────────────────────────────────
  // .use(
  //   cors({
  //     origin: ALLOWED_ORIGIN,
  //     methods: ["GET", "POST", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //   })
  // )
  // ── Health checks ────────────────────────────────────────────────────────
  .get("/", () => "Hello from Bun + Elysia on Vercel!")
  .get("/api/health", () => ({
    status: "ok",
    service: "Kadaba Document Generator",
    version: "2.0.0",
    runtime: "Bun",
    timestamp: new Date().toISOString(),
  }))
  // ── API routes ───────────────────────────────────────────────────────────
  // .group("/api", (app) => app.use(documentsRoutes).use(emailRoutes))
  // ── Listen only when running locally ─────────────────────────────────────
  .listen(PORT, () => {
    console.log(`🚀 Listening on http://localhost:${PORT}`);
  });
/* -------------------------------------------------------------
   Vercel expects a default export that is a function
   receiving (req, res) like a normal Node/Bun server.
   Elysia ships a `handle` method that works out‑of‑the‑box.
   ------------------------------------------------------------- */
export default app.handle;