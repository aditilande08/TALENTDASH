// ── Currency Configuration ──
// Conversion rates stored in config (not hardcoded in components)
export const CURRENCY_RATES: Record<string, number> = {
  INR: 1,
  USD: 84, // 1 USD = 84 INR
  GBP: 106, // 1 GBP = 106 INR
  EUR: 91, // 1 EUR = 91 INR
};

// ── Currency Formatting ──
// Supports Indian lakh/crore system for INR
export function formatINR(
  amount: number | bigint,
  compact: boolean = true
): string {
  return formatCurrency(amount, "INR", compact);
}

export function formatCurrency(
  amount: number | bigint,
  currency: string = "INR",
  compact: boolean = true
): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;

  if (currency === "USD") {
    if (compact && num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (compact && num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString("en-US")}`;
  }

  if (currency === "GBP") {
    if (compact && num >= 1000000) return `£${(num / 1000000).toFixed(1)}M`;
    if (compact && num >= 1000) return `£${(num / 1000).toFixed(0)}K`;
    return `£${num.toLocaleString("en-GB")}`;
  }

  if (currency === "EUR") {
    if (compact && num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
    if (compact && num >= 1000) return `€${(num / 1000).toFixed(0)}K`;
    return `€${num.toLocaleString("de-DE")}`;
  }

  // INR — Indian lakh/crore system
  if (compact) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

// Full format (no compact abbreviation)
export function formatCurrencyFull(
  amount: number | bigint,
  currency: string = "INR"
): string {
  return formatCurrency(amount, currency, false);
}

// Convert between currencies (everything normalized to INR internally)
export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  const inINR = amount * (CURRENCY_RATES[from] || 1);
  return Math.round(inINR / (CURRENCY_RATES[to] || 1));
}

// ── Company Name Normalisation ──
const LEGAL_SUFFIXES =
  /\s*(pvt\.?\s*ltd\.?|private\s+limited|inc\.?|ltd\.?|llc\.?|corp\.?|corporation|\.com|limited)\s*$/i;

const COMPANY_ALIASES: Record<string, string> = {
  "tata consultancy services": "tcs",
  "tata consultancy": "tcs",
  "tcs ltd": "tcs",
  "amazon web services": "amazon",
  "amazon.com": "amazon",
  "flipkart internet": "flipkart",
  "wipro technologies": "wipro",
  "infosys bpo": "infosys",
  "google india": "google",
};

export function normalizeCompanyName(raw: string): string {
  let name = raw.toLowerCase().trim();
  name = name.replace(LEGAL_SUFFIXES, "").trim();
  if (COMPANY_ALIASES[name]) return COMPANY_ALIASES[name];
  return name;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Math Helpers ──
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Display "—" for zero/null/undefined values (em dash, never blank)
export function displayOrDash(
  value: number | bigint | null | undefined,
  currency: string = "INR"
): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "bigint" ? Number(value) : value;
  if (num === 0) return "—";
  return formatCurrency(num, currency);
}

// ── Level Display Config ──
export const LEVEL_BADGE_STYLES: Record<
  string,
  { bg: string; text: string }
> = {
  L3: { bg: "bg-slate-100", text: "text-slate-700" },
  L4: { bg: "bg-blue-100", text: "text-blue-700" },
  L5: { bg: "bg-indigo-100", text: "text-indigo-700" },
  L6: { bg: "bg-purple-100", text: "text-purple-700" },
  SDE_I: { bg: "bg-slate-100", text: "text-slate-700" },
  SDE_II: { bg: "bg-blue-100", text: "text-blue-700" },
  SDE_III: { bg: "bg-indigo-100", text: "text-indigo-700" },
  STAFF: { bg: "bg-purple-100", text: "text-purple-700" },
  PRINCIPAL: { bg: "bg-[#1e3a5f]", text: "text-white" },
  IC4: { bg: "bg-blue-100", text: "text-blue-700" },
  IC5: { bg: "bg-indigo-100", text: "text-indigo-700" },
};

export const LEVEL_DISPLAY: Record<string, string> = {
  L3: "L3",
  L4: "L4",
  L5: "L5",
  L6: "L6",
  SDE_I: "SDE-I",
  SDE_II: "SDE-II",
  SDE_III: "SDE-III",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
  IC4: "IC4",
  IC5: "IC5",
};

// Valid levels for validation
export const VALID_LEVELS = [
  "L3", "L4", "L5", "L6",
  "SDE_I", "SDE_II", "SDE_III",
  "STAFF", "PRINCIPAL", "IC4", "IC5",
] as const;

export const VALID_CURRENCIES = ["INR", "USD", "GBP", "EUR"] as const;
export const VALID_SOURCES = ["CONTRIBUTOR", "SCRAPED", "AI_INFERRED"] as const;
