import { Elysia } from "elysia";
// import { cors } from "@elysiajs/cors";
import { documentsRoutes } from "./routes/documents.ts";
import { emailRoutes } from "./routes/email.ts";
const PORT = Number(process.env.PORT ?? 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";
const app = new Elysia()
  // ── CORS (optional, usually needed for browsers)
  // .use(
  //   cors({
  //     origin: ALLOWED_ORIGIN,
  //     methods: ["GET", "POST", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //   })
  // )
  // ── Simple health checks
  .get("/", () => "Hello from Bun + Elysia on Vercel!")
  .get("/api/health", () => ({
    status: "ok",
    service: "Kadaba Document Generator",
    version: "2.0.0",
    runtime: "Bun",
    timestamp: new Date().toISOString(),
  }))
  // ── API sub‑router (prefix = /api)
  .group("/api", (app) => app.use(documentsRoutes).use(emailRoutes))
  // ── Start server (only when you run locally)
  // .listen(PORT);
export default app;