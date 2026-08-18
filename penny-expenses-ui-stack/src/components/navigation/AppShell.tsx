import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Receipt, Sparkles, User, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between p-4 md:flex">
        <div className="surface flex h-full flex-col p-5">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-butter text-lg">💸</span>
            <span className="font-display text-lg font-semibold tracking-tight">Penny</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setOpen(true)}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-butter px-4 py-3 text-sm font-semibold text-butter-ink transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" /> Agregar gasto
          </button>

          <p className="mt-auto pt-6 text-xs leading-relaxed text-muted-foreground">
            Finance doesn&apos;t have to look boring.
          </p>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 md:pl-64 md:pr-6 md:pb-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:hidden">
        <div className="surface relative flex items-center justify-between px-2 py-2 shadow-lift">
          {NAV.slice(0, 2).map((item) => (
            <NavPill key={item.to} {...item} path={path} />
          ))}
          <button
            aria-label="Agregar gasto"
            onClick={() => setOpen(true)}
            className="-mt-8 grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform active:scale-90"
          >
            <Plus className="size-6" />
          </button>
          {NAV.slice(2).map((item) => (
            <NavPill key={item.to} {...item} path={path} />
          ))}
        </div>
      </nav>

      <ExpenseFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NavPill({
  to,
  label,
  icon: Icon,
  path,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  path: string;
}) {
  const active = to === "/" ? path === "/" : path.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-2xl transition-colors",
          active ? "bg-butter text-butter-ink" : "bg-transparent",
        )}
      >
        <Icon className="size-4" />
      </span>
      {label}
    </Link>
  );
}
