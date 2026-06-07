// src/index.ts
import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Hello from Bun + Elysia on Vercel!")
  .get("/api/user", () => ({ id: 1, name: "Bun User" }));

// Critical step for Vercel deployment
export default app; 
