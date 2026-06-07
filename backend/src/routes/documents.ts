import { Elysia } from "elysia";
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
import type { AllocationRequest, ReceiptRequest } from "../types.ts";

export const documentsRoutes = new Elysia({ prefix: "/documents" })

  .get("/counters", async () => {
    const c = await getCounters();
    return {
      nextReceipt: padNumber(c.receipt + 1),
      nextAllocation: c.allocation + 1,
    };
  })

  .post("/allocation", async ({ body, set }) => {
    const { buyer, property, financials } = body as AllocationRequest;

    if (
      !buyer?.name ||
      !buyer?.phone ||
      !property?.description ||
      !financials?.offerPrice
    ) {
      set.status = 400;
      return { error: "Missing required fields." };
    }

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
      // ⚠️ UPDATE YOUR pdfService TO RETURN A BUFFER INSTEAD OF A FILEPATH
      const pdfBuffer = await generateAllocationPdf({
        buyer,
        property,
        financials: { ...financials, offerPrice, discount, vatPct },
        ref,
        date,
      });

      const filename = `allocation_${ref}.pdf`;

      // Return file instantly instead of saving locally
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      set.headers["Content-Type"] = "application/pdf";

      return pdfBuffer;
    } catch (err: any) {
      console.error("Allocation PDF error:", err);
      set.status = 500;
      return {
        error: "Failed to generate allocation letter.",
        detail: err.message,
      };
    }
  })

  .post("/receipt", async ({ body, set }) => {
    const { payer, purpose, amount, method, date, bankRef, balance, notes } =
      body as ReceiptRequest;

    if (!payer?.name || !amount || !date) {
      set.status = 400;
      return { error: "payer.name, amount, and date are required." };
    }

    // ⚠️ WARNING: counterStore must read/write to a database (MongoDB, Postgres, Redis), NOT a local file!
    const counter = await nextCounter("receipt");
    const receiptNo = padNumber(counter);

    try {
      // ⚠️ UPDATE YOUR pdfService TO RETURN A BUFFER
      const pdfBuffer = await generateReceiptPdf({
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

      const filename = `receipt_${receiptNo}.pdf`;

      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      set.headers["Content-Type"] = "application/pdf";

      return pdfBuffer;
    } catch (err: any) {
      console.error("Receipt PDF error:", err);
      set.status = 500;
      return { error: "Failed to generate receipt.", detail: err.message };
    }
  });
