import { ArrowUpDown, Lock, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CATEGORY_STYLE } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/expense";
import { formatMoney } from "@/utils/currencyUtils";
import { formatDateES, formatDateShort, isCurrentMonth } from "@/utils/dateUtils";


const PAGE_SIZE = 12;

export function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: "date" | "amount"; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  });
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<Expense | null>(null);

  const sorted = useMemo(() => {
    const copy = [...expenses];
    copy.sort((a, b) => {
      const v = sort.key === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return sort.dir === "asc" ? v : -v;
    });
    return copy;
  }, [expenses, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggle = (key: "date" | "amount") =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <>
      <div className="-mx-1 overflow-x-auto px-1 md:overflow-x-visible">
        <table className="w-full min-w-full md:min-w-[860px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-muted-foreground uppercase">
              <Th onClick={() => toggle("date")} sortable className="whitespace-nowrap">
                Fecha
              </Th>
              <Th className="hidden md:table-cell">Método</Th>
              <Th className="whitespace-nowrap">Categoría</Th>
              <Th className="hidden md:table-cell">Moneda</Th>
              <Th className="w-full">Descripción</Th>
              <Th onClick={() => toggle("amount")} sortable align="right" className="whitespace-nowrap">
                Monto
              </Th>
              <Th className="hidden md:table-cell" align="right">
                Te deben
              </Th>
              <Th className="hidden md:table-cell" align="right">
                Estado
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const editable = isCurrentMonth(e.date);
              const style = CATEGORY_STYLE[e.category] ?? CATEGORY_STYLE.Otros;
              return (
                <tr key={e.id} className="animate-rise bg-card transition-colors hover:bg-secondary/60">
                  <Td className="rounded-l-2xl whitespace-nowrap">
                    <span className="md:hidden">{formatDateShort(e.date)}</span>
                    <span className="hidden md:inline">{formatDateES(e.date)}</span>
                  </Td>
                  <Td className="hidden md:table-cell whitespace-nowrap text-muted-foreground">
                    {e.paymentMethod}
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap md:gap-1.5 md:px-2.5",
                        style.bg,
                        style.ink,
                      )}
                    >
                      {style.emoji} {e.category}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell text-muted-foreground">{e.currency}</Td>
                  <Td className="max-w-[90px] truncate md:max-w-[220px]">{e.description || "—"}</Td>
                  <Td align="right" className="num whitespace-nowrap font-semibold">
                    <div className="flex flex-col items-end gap-1">
                      <span>{formatMoney(e.amount, e.currency)}</span>
                      {editable && (
                        <span className="inline-flex gap-1 md:hidden">
                          <IconBtn label="Editar" compact onClick={() => onEdit(e)}>
                            <Pencil className="size-3" />
                          </IconBtn>
                          <IconBtn label="Eliminar" compact tone="rose" onClick={() => setPending(e)}>
                            <Trash2 className="size-3" />
                          </IconBtn>
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right" className="hidden md:table-cell num text-mint-ink">
                    {e.reimbursableAmount > 0 ? formatMoney(e.reimbursableAmount, e.currency) : "—"}
                  </Td>
                  <Td align="right" className="hidden md:table-cell rounded-r-2xl">
                    {editable ? (
                      <span className="inline-flex gap-1">
                        <IconBtn label="Editar" onClick={() => onEdit(e)}>
                          <Pencil className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="Eliminar" tone="rose" onClick={() => setPending(e)}>
                          <Trash2 className="size-3.5" />
                        </IconBtn>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        <Lock className="size-3" /> Histórico
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>



      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {sorted.length} {sorted.length === 1 ? "gasto" : "gastos"} · página {current + 1} de {pages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-2xl bg-secondary px-4 py-2 font-medium disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(Math.min(pages - 1, current + 1))}
            disabled={current >= pages - 1}
            className="rounded-2xl bg-secondary px-4 py-2 font-medium disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      <AlertDialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              ¿Eliminar este gasto?
            </AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pending) onDelete(pending.id);
                setPending(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Th({
  children,
  onClick,
  sortable,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  sortable?: boolean;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th className={cn("px-4 pb-1 font-semibold", align === "right" && "text-right", className)}>
      {sortable ? (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
          {children} <ArrowUpDown className="size-3" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}


function Td({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td className={cn("px-4 py-3.5", align === "right" && "text-right", className)}>{children}</td>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone?: "rose";
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-xl transition-transform active:scale-90",
        tone === "rose" ? "bg-rose text-rose-ink" : "bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
