const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function helper(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n] + " ";
  if (n < 100) return TENS[Math.floor(n / 10)] + " " + (n % 10 ? ONES[n % 10] + " " : "");
  if (n < 1_000) return ONES[Math.floor(n / 100)] + " Hundred " + helper(n % 100);
  if (n < 1_000_000) return helper(Math.floor(n / 1_000)) + "Thousand " + helper(n % 1_000);
  if (n < 1_000_000_000) return helper(Math.floor(n / 1_000_000)) + "Million " + helper(n % 1_000_000);
  return helper(Math.floor(n / 1_000_000_000)) + "Billion " + helper(n % 1_000_000_000);
}

/** 30000000 → "Thirty Million Naira Only" */
export function toNairaWords(amount: number): string {
  const n = Math.round(amount);
  if (!n) return "Zero Naira Only";
  return helper(n).trim() + " Naira Only";
}

/** 30000000 → "₦30,000,000.00" */
export function formatNaira(amount: number): string {
  return (
    "₦" +
    Number(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Format a date string or Date to "15th March, 2023" style */
export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

/** Ordinal suffix: 1→"1st", 2→"2nd", etc. */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
