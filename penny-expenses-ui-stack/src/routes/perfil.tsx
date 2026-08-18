import { createFileRoute } from "@tanstack/react-router";

import { AppPage } from "@/components/navigation/AppPage";
import { Panel, SectionHeader } from "@/components/ui/states";
import { CATEGORY_STYLE, CURRENCY_STYLE, METHOD_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS } from "@/types/expense";
import { currentMonthRange } from "@/utils/dateUtils";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil y configuración — Peculio" },
      {
        name: "description",
        content:
          "Gestiona tu identidad, revisa categorías, métodos de pago y monedas disponibles en Peculio.",
      },
      { property: "og:title", content: "Perfil — Peculio" },
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
  const month = currentMonthRange();

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

        <Panel title="Periodo abierto" hint="Se calcula automáticamente">
          <p className="text-sm text-muted-foreground">
            Ahora mismo puedes crear, editar y eliminar gastos de{" "}
            <span className="font-semibold text-foreground">{month.label}</span>. Todo lo anterior
            queda en modo histórico 🔒, tanto en la app como en el backend.
          </p>
        </Panel>

        <Panel title="Categorías">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-medium",
                  CATEGORY_STYLE[c].bg,
                  CATEGORY_STYLE[c].ink,
                )}
              >
                {CATEGORY_STYLE[c].emoji} {c}
              </span>
            ))}
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
              Los totales nunca se suman entre monedas. Sin conversiones automáticas.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
