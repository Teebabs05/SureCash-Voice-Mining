import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "NGN") {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function generateReference(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
}

// Collapses the different ways someone can type the same Nigerian number
// (+2348012345678, 2348012345678, 8012345678, 08012345678) into one
// canonical "0XXXXXXXXXX" form, so the phone uniqueness check actually
// catches duplicates instead of only matching identical raw strings.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 11) return digits;
  if (digits.length === 10) return "0" + digits;
  return digits;
}
