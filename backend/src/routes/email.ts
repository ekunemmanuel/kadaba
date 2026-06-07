import { Elysia } from "elysia";
import { join } from "path";
import { existsSync } from "fs";
import { sendAllocationEmail, sendReceiptEmail } from "../services/emailService.ts";
import type { SendAllocationEmailRequest, SendReceiptEmailRequest } from "../types.ts";

const GENERATED_DIR = process.env.GENERATED_DIR ?? "./generated";

export const emailRoutes = new Elysia({ prefix: "/email" })

  // ── POST /allocation ──────────────────────────────────────────────────────
  .post("/allocation", async ({ body, set }) => {
    const { recipientEmail, recipientName, filename, ref } = body as SendAllocationEmailRequest;

    if (!recipientEmail || !filename || !ref) {
      set.status = 400;
      return { error: "recipientEmail, filename, and ref are required." };
    }

    const filepath = join(GENERATED_DIR, filename.replace(/[^a-zA-Z0-9_.\-]/g, ""));
    if (!existsSync(filepath)) {
      set.status = 404;
      return { error: "PDF not found. Generate the document first." };
    }

    try {
      await sendAllocationEmail(recipientEmail, recipientName ?? "Sir/Ma", filepath, ref);
      return { success: true, message: `Allocation letter sent to ${recipientEmail}` };
    } catch (err: any) {
      set.status = 500;
      return { error: "Failed to send email.", detail: err.message };
    }
  })

  // ── POST /receipt ─────────────────────────────────────────────────────────
  .post("/receipt", async ({ body, set }) => {
    const { recipientEmail, recipientName, filename, receiptNo } = body as SendReceiptEmailRequest;

    if (!recipientEmail || !filename || !receiptNo) {
      set.status = 400;
      return { error: "recipientEmail, filename, and receiptNo are required." };
    }

    const filepath = join(GENERATED_DIR, filename.replace(/[^a-zA-Z0-9_.\-]/g, ""));
    if (!existsSync(filepath)) {
      set.status = 404;
      return { error: "PDF not found. Generate the document first." };
    }

    try {
      await sendReceiptEmail(recipientEmail, recipientName ?? "Sir/Ma", filepath, receiptNo);
      return { success: true, message: `Receipt sent to ${recipientEmail}` };
    } catch (err: any) {
      set.status = 500;
      return { error: "Failed to send email.", detail: err.message };
    }
  });
