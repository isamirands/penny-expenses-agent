import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/utils/currencyUtils";
import type { Currency } from "@/types/expense";

const AXIS = { fontSize: 11, fill: "oklch(0.53 0.02 285)" };

function TooltipBox({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; payload?: { name?: string } }[];
  label?: string;
  currency: Currency;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!;
  return (
    <div className="rounded-2xl bg-card px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold">{label ?? p.payload?.name ?? p.name}</p>
      <p className="num text-muted-foreground">{formatMoney(Number(p.value ?? 0), currency)}</p>
    </div>
  );
}

export function MonthlyChart({
  data,
  currency,
}: {
  data: { month: string; total: number }[];
  currency: Currency;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={54} />
        <Tooltip
          cursor={{ fill: "oklch(0.94 0.02 90)", radius: 12 }}
          content={<TooltipBox currency={currency} />}
        />
        <Bar dataKey="total" radius={[12, 12, 12, 12]} fill="var(--lavender)" animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({
  data,
  currency,
}: {
  data: { month: string; total: number }[];
  currency: Currency;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--mint)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={54} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--mint-ink)"
          strokeWidth={2.5}
          fill="url(#trendFill)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  currency,
}: {
  data: { name: string; value: number; share: number; color?: string }[];
  currency: Currency;
}) {
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            stroke="none"
            animationDuration={700}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? "#d8d4cc"} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="grid gap-2">
        {data.slice(0, 6).map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: d.color ?? "#d8d4cc" }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="num text-muted-foreground">{d.share.toFixed(0)}%</span>
            <span className="num font-medium">{formatMoney(d.value, currency, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBars({
  data,
  currency,
}: {
  data: { name: string; value: number; share: number; color?: string }[];
  currency: Currency;
}) {
  return (
    <ul className="grid gap-3">
      {data.map((d) => (
        <li key={d.name} className="grid gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="truncate">{d.name}</span>
            <span className="num font-medium">{formatMoney(d.value, currency, true)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(d.share, 2)}%`, backgroundColor: d.color ?? "#c6c9f2" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
