import Handlebars from "handlebars";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import type { AllocationRequest, ReceiptRequest } from "../types.ts";
import { toNairaWords, formatNaira, formatDate } from "../utils/nairaWords.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "../templates");
const GENERATED_DIR = process.env.GENERATED_DIR ?? "./generated";

// Ensure generated dir exists
await Bun.write(join(GENERATED_DIR, ".gitkeep"), "");

// ─── Template loader (cached) ─────────────────────────────────────────────────

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

async function getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  if (templateCache.has(name)) return templateCache.get(name)!;
  const file = Bun.file(join(TEMPLATES_DIR, name));
  const source = await file.text();
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  return compiled;
}

// ─── Puppeteer launcher ───────────────────────────────────────────────────────

async function htmlToPdf(html: string, filename: string): Promise<string> {
  // Dynamically import puppeteer-core so this module loads even without it installed
  const puppeteer = await import("puppeteer-core");

  const chromiumPath =
    process.env.CHROMIUM_PATH ??
    // Common locations — first one found wins
    [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ].find((p) => {
      try {
        return Bun.file(p).size > 0;
      } catch {
        return false;
      }
    }) ??
    "";

  if (!chromiumPath) {
    throw new Error(
      "Chromium not found. Set CHROMIUM_PATH in .env or install chromium-browser.\n" +
        "Ubuntu: sudo apt install chromium-browser\n" +
        "macOS:  brew install --cask google-chrome",
    );
  }

  const browser = await puppeteer.default.launch({
    executablePath: chromiumPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const outputPath = join(GENERATED_DIR, filename);
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    return basename(outputPath); // ← return bare filename only, e.g. "Receipt_0019_...pdf"
  } finally {
    await browser.close();
  }
}

// ─── Allocation Letter ────────────────────────────────────────────────────────

export async function generateAllocationPdf(
  data: AllocationRequest & { ref: string; date: string; letterBody?: string },
): Promise<string> {
  const { buyer, property, financials, ref, date } = data;

  const offerPrice = Number(financials.offerPrice);
  const discount = Number(financials.discount) || 0;
  const vatPct = Number(financials.vatPct) || 0;
  const afterDisc = offerPrice - discount;
  const vatAmt = afterDisc * (vatPct / 100);
  const total = afterDisc + vatAmt;
  const deposit = Number(financials.deposit) || 0;

  // Build location string e.g. "DUSTE. (PLOT NO: 95, CADASTRAL ZONE B14)"
  const locationParts: string[] = [property.location.toUpperCase()];
  if (property.plotNo || property.cadastralZone) {
    const sub: string[] = [];
    if (property.plotNo) sub.push(`PLOT NO: ${property.plotNo}`);
    if (property.cadastralZone) sub.push(property.cadastralZone.toUpperCase());
    locationParts.push(`(${sub.join(", ")})`);
  }

  const templateData = {
    ref,
    date,
    buyer: {
      ...buyer,
      photoBase64: buyer.photoBase64 ?? null,
    },
    property,
    financials: {
      ...financials,
      durationText: financials.durationText.toUpperCase(),
    },
    propertyLocationFull: locationParts.join(" "),
    offerPriceFmt: `N${offerPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
    offerPriceWords: toNairaWords(offerPrice).toUpperCase(),
    hasDiscount: discount > 0,
    discountFmt:
      discount > 0
        ? `N${discount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
        : null,
    discountWords: discount > 0 ? toNairaWords(discount).toUpperCase() : null,
    vatFmt:
      vatAmt > 0
        ? `N${vatAmt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
        : "NIL",
    vatWords: vatAmt > 0 ? toNairaWords(vatAmt).toUpperCase() : "NIL",
    totalFmt: `N${total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
    totalWords: toNairaWords(total).toUpperCase(),
    depositFmt:
      deposit > 0
        ? `${deposit.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
        : null,
    depositWords: deposit > 0 ? toNairaWords(deposit) : null,
    logoBase64: null, // TODO: load company logo as base64 here
  };

  const template = await getTemplate("allocation.html");
  const html = template(templateData);

  const safeRef = ref.replace(/\//g, "_");
  const filename = `AllocationLetter_${safeRef}_${Date.now()}.pdf`;
  return htmlToPdf(html, filename);
}

// ─── Payment Receipt ──────────────────────────────────────────────────────────

export async function generateReceiptPdf(
  data: ReceiptRequest & { receiptNo: string },
): Promise<string> {
  const {
    payer,
    purpose,
    amount,
    method,
    date,
    bankRef,
    balance,
    notes,
    receiptNo,
  } = data;

  const templateData = {
    receiptNo,
    date: formatDate(date),
    payer,
    purpose,
    amountFmt: formatNaira(amount),
    amountWords: toNairaWords(amount),
    bankRef: bankRef ?? null,
    balance: balance ?? null,
    notes: notes ?? null,
    isCash: method === "Cash",
    isBankTransfer: method === "Bank Transfer",
    isCheque: method === "Cheque",
    isPOS: method === "POS",
    logoBase64: null,
  };

  const template = await getTemplate("receipt.html");
  const html = template(templateData);

  const safeName = (payer.name ?? "Payer").replace(/\s+/g, "_");
  const filename = `Receipt_${receiptNo}_${safeName}_${Date.now()}.pdf`;
  return htmlToPdf(html, filename);
}

// ─── HTML preview (no PDF) for testing ───────────────────────────────────────

export async function renderAllocationHtml(
  data: AllocationRequest & { ref: string; date: string },
): Promise<string> {
  const template = await getTemplate("allocation.html");
  return template(data);
}

export async function renderReceiptHtml(
  data: ReceiptRequest & { receiptNo: string },
): Promise<string> {
  const template = await getTemplate("receipt.html");
  return template({ ...data, date: formatDate(data.date) });
}
