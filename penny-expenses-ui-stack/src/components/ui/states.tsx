import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl leading-tight font-semibold md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Panel({
  children,
  className,
  title,
  hint,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  hint?: string;
}) {
  return (
    <section className={cn("surface animate-rise p-5 md:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({
  title = "Todavía no hay gastos por aquí 🌱",
  detail = "Agrega tu primer gasto para comenzar a ver tus estadísticas.",
  action,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-3xl bg-mint text-2xl">🌱</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-3xl bg-secondary" />
      ))}
    </div>
  );
}

export function ErrorState({
  onRetry,
  title = "No pudimos conectar con tus gastos",
  detail = "Inténtalo nuevamente.",
}: {
  onRetry: () => void;
  title?: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-rose/40 px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-3xl bg-rose text-2xl">🙈</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>
      <button
        onClick={onRetry}
        className="mt-5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
      >
        Reintentar
      </button>
    </div>
  );
}
