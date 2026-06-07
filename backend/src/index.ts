// import { Elysia } from "elysia";
// import { cors } from "@elysiajs/cors";
// import { documentsRoutes } from "./routes/documents.ts";
// import { emailRoutes } from "./routes/email.ts";

// const PORT = Number(process.env.PORT ?? 3000);
// const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

// const app = new Elysia()
//   .use(
//     cors({
//       origin: ALLOWED_ORIGIN,
//       methods: ["GET", "POST", "OPTIONS"],
//       allowedHeaders: ["Content-Type", "Authorization"],
//     }),
//   )
//   // Health check
//   .get("/api/health", () => ({
//     status: "ok",
//     service: "Kadaba Document Generator",
//     version: "2.0.0",
//     runtime: "Bun",
//     timestamp: new Date().toISOString(),
//   }))
//   // API routes
//   .group("/api", (app) => app.use(documentsRoutes).use(emailRoutes))
//   .listen(PORT);

// console.log(`
// ╔══════════════════════════════════════════════════╗
// ║   Kadaba Document Generator API                  ║
// ║   Version: 2.0.0  |  Runtime: Bun + Elysia      ║
// ║   Listening on http://localhost:${PORT}           ║
// ╚══════════════════════════════════════════════════╝
// `);

// export default app;
// export type App = typeof app;

import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => `Hello from Elysia, running on Vercel!`);

export default app;
