import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { expensesService } from "@/services/expensesService";
import type { Expense, ExpenseInput } from "@/types/expense";
import { useProfile } from "./useProfile";

export function useExpenses() {
  const { profile } = useProfile();
  const userId = profile?.email ?? "";
  const queryClient = useQueryClient();
  const key = ["expenses", userId];

  const query = useQuery<Expense[]>({
    queryKey: key,
    queryFn: () => expensesService.getExpenses(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (input: ExpenseInput) => expensesService.createExpense(userId, input),
    onSuccess: () => {
      toast.success("¡Gasto agregado! ✨");
      void invalidate();
    },
    onError: () => toast.error("No pudimos guardar el gasto. Inténtalo nuevamente."),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      expensesService.updateExpense(userId, id, input),
    onSuccess: () => {
      toast.success("Gasto actualizado.");
      void invalidate();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("periodo")
          ? "Este gasto pertenece a un periodo cerrado y es solo de lectura."
          : "No pudimos guardar el gasto. Inténtalo nuevamente.",
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(userId, id),
    onSuccess: () => {
      toast.success("Gasto eliminado.");
      void invalidate();
    },
    onError: () => toast.error("No pudimos eliminar el gasto. Inténtalo nuevamente."),
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    create,
    update,
    remove,
  };
}
