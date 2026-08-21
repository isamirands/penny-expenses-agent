import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { budgetsService } from "@/services/budgetsService";
import type { Categoria, IngresoFijo, Presupuesto } from "@/types/expense";
import { useProfile } from "./useProfile";

export function useBudgets() {
  const { profile } = useProfile();
  const userId = profile?.email ?? "";
  const queryClient = useQueryClient();

  const presupuestosQuery = useQuery<Presupuesto[]>({
    queryKey: ["presupuestos", userId],
    queryFn: () => budgetsService.getPresupuestos(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const categoriasQuery = useQuery<Categoria[]>({
    queryKey: ["categorias", userId],
    queryFn: () => budgetsService.getCategorias(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const ingresosFijosQuery = useQuery<IngresoFijo[]>({
    queryKey: ["ingresosFijos", userId],
    queryFn: () => budgetsService.getIngresosFijos(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const updatePresupuesto = useMutation({
    mutationFn: ({ id, porcentaje }: { id: string; porcentaje: number }) =>
      budgetsService.updatePresupuesto(userId, id, porcentaje),
    onSuccess: () => {
      toast.success("Presupuesto actualizado.");
      void queryClient.invalidateQueries({ queryKey: ["presupuestos", userId] });
    },
    onError: () => toast.error("No pudimos actualizar el presupuesto. Inténtalo nuevamente."),
  });

  const createIngresoFijo = useMutation({
    mutationFn: (input: Omit<IngresoFijo, "id">) => budgetsService.createIngresoFijo(userId, input),
    onSuccess: () => {
      toast.success("Ingreso fijo agregado. ✨");
      void queryClient.invalidateQueries({ queryKey: ["ingresosFijos", userId] });
    },
    onError: () => toast.error("No pudimos guardar el ingreso fijo. Inténtalo nuevamente."),
  });

  return {
    presupuestos: presupuestosQuery.data ?? [],
    categorias: categoriasQuery.data ?? [],
    ingresosFijos: ingresosFijosQuery.data ?? [],
    isLoading:
      presupuestosQuery.isLoading || categoriasQuery.isLoading || ingresosFijosQuery.isLoading,
    isError: presupuestosQuery.isError || categoriasQuery.isError || ingresosFijosQuery.isError,
    updatePresupuesto,
    createIngresoFijo,
  };
}
