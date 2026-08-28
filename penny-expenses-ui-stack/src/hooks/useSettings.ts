import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { settingsService } from "@/services/settingsService";
import type { Settings } from "@/types/expense";
import { DEFAULT_CUTOFF_DAY } from "@/utils/dateUtils";
import { useProfile } from "./useProfile";

export function useSettings() {
  const { profile } = useProfile();
  const userId = profile?.email ?? "";
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<Settings>({
    queryKey: ["settings", userId],
    queryFn: () => settingsService.getSettings(userId),
    enabled: Boolean(userId),
    retry: 1,
  });

  const updateCutoffDay = useMutation({
    mutationFn: (cutoffDay: number) => settingsService.updateCutoffDay(userId, cutoffDay),
    onSuccess: () => {
      toast.success("Día de corte actualizado.");
      void queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    },
    onError: () => toast.error("No pudimos actualizar tu día de corte. Inténtalo nuevamente."),
  });

  return {
    cutoffDay: settingsQuery.data?.cutoffDay ?? DEFAULT_CUTOFF_DAY,
    isLoading: settingsQuery.isLoading,
    updateCutoffDay,
  };
}
