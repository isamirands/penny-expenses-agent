import type { Category, Currency, PaymentMethod } from "@/types/expense";

export interface Palette {
  bg: string;
  ink: string;
  hex: string;
}

export const CATEGORY_STYLE: Record<Category, Palette & { emoji: string }> = {
  Alimentación: { bg: "bg-butter", ink: "text-butter-ink", hex: "#f2d675", emoji: "🍜" },
  Transporte: { bg: "bg-sky", ink: "text-sky-ink", hex: "#bcd8f0", emoji: "🚌" },
  Vivienda: { bg: "bg-lilac", ink: "text-lilac-ink", hex: "#dcc4ee", emoji: "🏠" },
  Entretenimiento: { bg: "bg-blush", ink: "text-blush-ink", hex: "#f4c4d4", emoji: "🎬" },
  Compras: { bg: "bg-peach", ink: "text-peach-ink", hex: "#f7cba6", emoji: "🛍" },
  Salud: { bg: "bg-rose", ink: "text-rose-ink", hex: "#f2b7ad", emoji: "💊" },
  Viajes: { bg: "bg-mint", ink: "text-mint-ink", hex: "#a9e5cd", emoji: "✈️" },
  Servicios: { bg: "bg-lavender", ink: "text-lavender-ink", hex: "#c6c9f2", emoji: "💡" },
  Educación: { bg: "bg-sand", ink: "text-sand-ink", hex: "#e6dcc4", emoji: "📚" },
  Otros: { bg: "bg-secondary", ink: "text-secondary-foreground", hex: "#d8d4cc", emoji: "✨" },
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
