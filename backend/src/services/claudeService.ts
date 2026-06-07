import { formatNaira, toNairaWords } from "../utils/nairaWords.ts";
import type { AllocationRequest } from "../types.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";

interface GenerateLetterParams extends AllocationRequest {
  ref: string;
  date: string;
  vatAmt: number;
  total: number;
}

/**
 * Use the Anthropic API to write the formal allocation letter body.
 * Falls back to a static template if the API key is missing or the call fails.
 */
export async function generateLetterBody(params: GenerateLetterParams): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-ant-your")) {
    return staticFallback(params);
  }

  const { ref, date, buyer, property, financials, vatAmt, total } = params;

  const prompt = `You are drafting a formal real estate Allocation Letter for Kadaba Construction Ltd.
Write a professional formal letter body only — no HTML, no markdown, plain text.

Company: Kadaba Construction Ltd
Date: ${date}
Reference: ${ref}

Buyer:
- Name: ${buyer.name}
- Phone: ${buyer.phone}
- Email: ${buyer.email ?? "N/A"}
- Address: ${buyer.address}

Property:
- Description: ${property.description} BLOCK NO.${property.blockNo}
- Estate: ${property.estate}
- Location: ${property.location}

Financial Terms:
- Offer Price: ${formatNaira(financials.offerPrice)}
- Discount: ${financials.discount > 0 ? formatNaira(financials.discount) : "No Discount"}
- VAT (${financials.vatPct}%): ${formatNaira(vatAmt)}
- Total Amount Payable: ${formatNaira(total)} (${toNairaWords(total)})
- Payment Duration: ${financials.durationText}
${financials.deposit > 0 ? `- Initial Deposit: ${formatNaira(financials.deposit)} (${toNairaWords(financials.deposit)})` : ""}

Write from "Dear Sir/Ma," through to the closing remarks. Do not include the signature block — that is rendered separately. Keep it formal and professional.`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);

    const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
    return data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch (err) {
    console.error("Claude API error, using fallback:", err);
    return staticFallback(params);
  }
}

function staticFallback(params: GenerateLetterParams): string {
  const { buyer, property, financials, total } = params;
  return `Dear Sir/Ma,

We are pleased to formally notify you of the provisional allocation of the above-described property to you, subject to the terms and conditions stated herein.

This allocation is made in respect of ${property.description} BLOCK NO.${property.blockNo}, located at ${property.estate}, ${property.location}.

The total amount payable for this property is ${formatNaira(total)} (${toNairaWords(total)}), with payment to be completed ${financials.durationText === "Outright" ? "outrightly" : `over ${financials.durationText}`}.

${financials.deposit > 0 ? `An initial deposit of ${formatNaira(financials.deposit)} (${toNairaWords(financials.deposit)}) is required to secure this allocation.` : ""}

Please note that this allocation is provisional and is subject to full compliance with the payment terms and conditions outlined herein.

Yours faithfully,
For Kadaba Construction Ltd`;
}
