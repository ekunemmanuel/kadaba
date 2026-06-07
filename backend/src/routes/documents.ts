import { Elysia, t } from "elysia";
import { join, basename } from "path";
import { existsSync } from "fs";
import {
  generateAllocationPdf,
  generateReceiptPdf,
} from "../services/pdfService.ts";
import {
  nextCounter,
  padNumber,
  buildAllocRef,
  getCounters,
} from "../utils/counterStore.ts";
import { formatDate } from "../utils/nairaWords.ts";
import type { AllocationRequest, ReceiptRequest } from "../types.ts";

const GENERATED_DIR = process.env.GENERATED_DIR ?? "./generated";

export const documentsRoutes = new Elysia({ prefix: "/documents" })

  // ── GET /counters ── (shows next receipt number in UI)
  .get("/counters", async () => {
    const c = await getCounters();
    return {
      nextReceipt: padNumber(c.receipt + 1),
      nextAllocation: c.allocation + 1,
    };
  })

  // ── POST /allocation ──────────────────────────────────────────────────────
  .post("/allocation", async ({ body, set }) => {
    const { buyer, property, financials } = body as AllocationRequest;

    // Validate required
    if (
      !buyer?.name ||
      !buyer?.phone ||
      !buyer?.address ||
      !property?.description ||
      !property?.blockNo ||
      !property?.estate ||
      !property?.location ||
      !financials?.offerPrice
    ) {
      set.status = 400;
      return { error: "Missing required fields." };
    }

    // Compute financials
    const offerPrice = Number(financials.offerPrice);
    const discount = Number(financials.discount) || 0;
    const vatPct = Number(financials.vatPct) || 5;
    const afterDisc = offerPrice - discount;
    const vatAmt = afterDisc * (vatPct / 100);
    const total = afterDisc + vatAmt;

    const year = new Date().getFullYear();
    const ref = buildAllocRef(property.location, year, property.blockNo);
    const date = new Date().toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    try {
      const pdfPath = await generateAllocationPdf({
        buyer,
        property,
        financials: { ...financials, offerPrice, discount, vatPct },
        ref,
        date,
      });

      const filename = basename(pdfPath); // safe on all OSes
      return {
        success: true,
        ref,
        filename,
        downloadUrl: `/api/documents/download/${filename}`,
      };
    } catch (err: any) {
      console.error("Allocation PDF error:", err);
      set.status = 500;
      return {
        error: "Failed to generate allocation letter.",
        detail: err.message,
      };
    }
  })

  // ── POST /receipt ─────────────────────────────────────────────────────────
  .post("/receipt", async ({ body, set }) => {
    const { payer, purpose, amount, method, date, bankRef, balance, notes } =
      body as ReceiptRequest;

    if (!payer?.name || !amount || !date) {
      set.status = 400;
      return { error: "payer.name, amount, and date are required." };
    }

    const counter = await nextCounter("receipt");
    const receiptNo = padNumber(counter);

    try {
      const pdfPath = await generateReceiptPdf({
        payer,
        purpose: purpose ?? "Property Payment",
        amount: Number(amount),
        method: method ?? "Bank Transfer",
        date,
        bankRef,
        balance,
        notes,
        receiptNo,
      });

      const filename = basename(pdfPath); // safe on all OSes
      return {
        success: true,
        receiptNo,
        filename,
        downloadUrl: `/api/documents/download/${filename}`,
      };
    } catch (err: any) {
      console.error("Receipt PDF error:", err);
      set.status = 500;
      return { error: "Failed to generate receipt.", detail: err.message };
    }
  })

  // ── GET /download/:filename ───────────────────────────────────────────────
  // .get("/download/:filename", ({ params, set }) => {
  //   const filename = params.filename.replace(/[^a-zA-Z0-9_.\-]/g, ""); // sanitise
  //   const filepath = join(GENERATED_DIR, filename);

  //   if (!existsSync(filepath)) {
  //     set.status = 404;
  //     return { error: "File not found." };
  //   }

  //   set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  //   set.headers["Content-Type"] = "application/pdf";
  //   return Bun.file(filepath);
  // });
