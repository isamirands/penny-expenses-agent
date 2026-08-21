import type { Currency, PaymentMethod } from "@/types/expense";

export interface Palette {
  bg: string;
  ink: string;
  hex: string;
}

/** Hand-curated styling for the 17 canonical categories (Categorias tab has
 * no color/emoji column — style is resolved by name, see categoryStyleFor). */
export const CATEGORY_STYLE: Record<string, Palette & { emoji: string }> = {
  // Gasto variable
  Ocio: { bg: "bg-butter", ink: "text-butter-ink", hex: "#f2d675", emoji: "🎮" },
  Belleza: { bg: "bg-sky", ink: "text-sky-ink", hex: "#bcd8f0", emoji: "💄" },
  Comidas: { bg: "bg-lilac", ink: "text-lilac-ink", hex: "#dcc4ee", emoji: "🍜" },
  Viajes: { bg: "bg-blush", ink: "text-blush-ink", hex: "#f4c4d4", emoji: "✈️" },
  Compras: { bg: "bg-peach", ink: "text-peach-ink", hex: "#f7cba6", emoji: "🛍" },
  Salud: { bg: "bg-rose", ink: "text-rose-ink", hex: "#f2b7ad", emoji: "💊" },
  Regalos: { bg: "bg-mint", ink: "text-mint-ink", hex: "#a9e5cd", emoji: "🎁" },
  Víveres: { bg: "bg-lavender", ink: "text-lavender-ink", hex: "#c6c9f2", emoji: "🛒" },
  Otros: { bg: "bg-secondary", ink: "text-secondary-foreground", hex: "#d8d4cc", emoji: "✨" },
  // Gasto fijo
  Transporte: { bg: "bg-sand", ink: "text-sand-ink", hex: "#e6dcc4", emoji: "🚌" },
  Suscripciones: { bg: "bg-butter", ink: "text-butter-ink", hex: "#f2d675", emoji: "📺" },
  Junta: { bg: "bg-sky", ink: "text-sky-ink", hex: "#bcd8f0", emoji: "🤝" },
  Menu: { bg: "bg-lilac", ink: "text-lilac-ink", hex: "#dcc4ee", emoji: "🍽️" },
  // Ahorro e inversión
  "Cuenta de ahorros": { bg: "bg-blush", ink: "text-blush-ink", hex: "#f4c4d4", emoji: "🏦" },
  Divisas: { bg: "bg-peach", ink: "text-peach-ink", hex: "#f7cba6", emoji: "💱" },
  Wardaditos: { bg: "bg-rose", ink: "text-rose-ink", hex: "#f2b7ad", emoji: "🐷" },
  "S&P": { bg: "bg-mint", ink: "text-mint-ink", hex: "#a9e5cd", emoji: "📈" },
};

const FALLBACK_PALETTE: (Palette & { emoji: string })[] = [
  { bg: "bg-butter", ink: "text-butter-ink", hex: "#f2d675", emoji: "✨" },
  { bg: "bg-sky", ink: "text-sky-ink", hex: "#bcd8f0", emoji: "✨" },
  { bg: "bg-lilac", ink: "text-lilac-ink", hex: "#dcc4ee", emoji: "✨" },
  { bg: "bg-blush", ink: "text-blush-ink", hex: "#f4c4d4", emoji: "✨" },
  { bg: "bg-peach", ink: "text-peach-ink", hex: "#f7cba6", emoji: "✨" },
  { bg: "bg-rose", ink: "text-rose-ink", hex: "#f2b7ad", emoji: "✨" },
  { bg: "bg-mint", ink: "text-mint-ink", hex: "#a9e5cd", emoji: "✨" },
  { bg: "bg-lavender", ink: "text-lavender-ink", hex: "#c6c9f2", emoji: "✨" },
  { bg: "bg-sand", ink: "text-sand-ink", hex: "#e6dcc4", emoji: "✨" },
];

/** Deterministic fallback for category names not in CATEGORY_STYLE (e.g. a
 * new row added directly in the "Categorias" sheet). */
export function categoryStyleFor(nombre: string): Palette & { emoji: string } {
  const known = CATEGORY_STYLE[nombre];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < nombre.length; i += 1) hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]!;
}

/** Styling for the 3 fixed Presupuestos, used on the Home budget cards. */
export const PRESUPUESTO_STYLE: Record<string, { hex: string; emoji: string; tone: string }> = {
  "Gasto variable": { hex: "#f7cba6", emoji: "🛍", tone: "bg-peach text-peach-ink" },
  "Gasto fijo": { hex: "#bcd8f0", emoji: "🏠", tone: "bg-sky text-sky-ink" },
  "Ahorro e inversión": { hex: "#a9e5cd", emoji: "🐷", tone: "bg-mint text-mint-ink" },
};

export const METHOD_STYLE: Record<PaymentMethod, { hex: string; emoji: string }> = {
  "Visa Oro": { hex: "#dcc4ee", emoji: "💳" },
  IO: { hex: "#f2d675", emoji: "💳" },
  Débito: { hex: "#bcd8f0", emoji: "🏦" },
};

export const CURRENCY_STYLE: Record<Currency, { hex: string; symbol: string }> = {
  PEN: { hex: "#f2d675", symbol: "S/" },
  USD: { hex: "#a9e5cd", symbol: "$" },
  EUR: { hex: "#c6c9f2", symbol: "€" },
};
