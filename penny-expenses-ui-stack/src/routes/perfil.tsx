import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppPage } from "@/components/navigation/AppPage";
import { Panel, SectionHeader } from "@/components/ui/states";
import { categoryStyleFor, CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useBudgets } from "@/hooks/useBudgets";
import { useProfile } from "@/hooks/useProfile";
import { useSettings } from "@/hooks/useSettings";
import { CURRENCIES, PAYMENT_METHODS } from "@/types/expense";
import { cycleRange } from "@/utils/dateUtils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil y configuración — Penny Expenses" },
      {
        name: "description",
        content:
          "Gestiona tu identidad, revisa categorías, métodos de pago y monedas disponibles en Penny Expenses.",
      },
      { property: "og:title", content: "Perfil — Penny Expenses" },
      {
        property: "og:description",
        content: "Configuración de categorías, métodos de pago y monedas de tu app de gastos.",
      },
    ],
  }),
  component: () => (
    <AppPage>
      <ProfilePage />
    </AppPage>
  ),
});

function ProfilePage() {
  const { profile, signOut } = useProfile();
  const { categorias, presupuestos } = useBudgets();
  const { cutoffDay, updateCutoffDay } = useSettings();
  const cycle = cycleRange(cutoffDay);
  const [cutoffInput, setCutoffInput] = useState(String(cutoffDay));

  useEffect(() => {
    setCutoffInput(String(cutoffDay));
  }, [cutoffDay]);

  function saveCutoffDay() {
    const day = Math.round(Number(cutoffInput));
    if (!Number.isFinite(day) || day < 1 || day > 31) {
      setCutoffInput(String(cutoffDay));
      return;
    }
    updateCutoffDay.mutate(day);
  }

  return (
    <>
      <SectionHeader
        eyebrow="Configuración"
        title="Tu perfil ✨"
        subtitle="Tu identidad define qué gastos ves. El backend solo devuelve los tuyos."
      />

      <div className="grid gap-5">
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-14 place-items-center rounded-3xl bg-lilac text-2xl">
              {profile?.name?.[0]?.toUpperCase() ?? "🙂"}
            </span>
            <div className="flex-1">
              <p className="font-display text-xl font-semibold">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
            >
              Cambiar de cuenta
            </button>
          </div>
        </Panel>

        <Panel title="Periodo abierto" hint="Editable">
          <p className="text-sm text-muted-foreground">
            Ahora mismo puedes crear, editar y eliminar gastos de tu ciclo actual:{" "}
            <span className="font-semibold text-foreground">{cycle.label}</span>. Todo lo anterior
            queda en modo histórico 🔒, tanto en la app como en el backend.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              Tu tarjeta corta el día
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={cutoffInput}
                onChange={(e) => setCutoffInput(e.target.value)}
                className="num w-16 rounded-2xl bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              de cada mes
            </label>
            <button
              onClick={saveCutoffDay}
              disabled={updateCutoffDay.isPending || cutoffInput === String(cutoffDay)}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
            >
              {updateCutoffDay.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </Panel>

        <Panel title="Presupuestos">
          <div className="flex flex-wrap gap-2">
            {presupuestos.map((p) => (
              <span key={p.id} className="rounded-full bg-secondary px-3 py-2 text-xs font-medium">
                {p.nombre} · {p.porcentaje}%
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Categorías">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => {
              const style = categoryStyleFor(c.nombre);
              return (
                <span
                  key={c.id}
                  className={cn("rounded-full px-3 py-2 text-xs font-medium", style.bg, style.ink)}
                >
                  {style.emoji} {c.nombre}
                </span>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-5 md:grid-cols-2">
          <Panel title="Métodos de pago">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <span key={m} className="rounded-full bg-secondary px-3 py-2 text-xs font-medium">
                  {METHOD_STYLE[m].emoji} {m}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title="Monedas">
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <span key={c} className="rounded-full bg-secondary px-3 py-2 text-xs font-medium">
                  {CURRENCY_STYLE[c].symbol} {c}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              En Insights los totales se muestran por moneda, sin mezclar. En Inicio se convierten a
              soles (Monto PEN) para poder sumarlos.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
