import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MarketInput, RouteStatus } from "@/types";
import { marketsService } from "@/services/markets-service";
import { queryKeys } from "@/lib/query-client";

export function useMarkets() {
  return useQuery({
    queryKey: queryKeys.markets,
    queryFn: marketsService.list,
  });
}

export function useMarket(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.market(id ?? "new"),
    queryFn: () => marketsService.get(id as string),
    enabled: !!id,
  });
}

export function useCreateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarketInput) => marketsService.create(input),
    onSuccess: (market) => {
      qc.invalidateQueries({ queryKey: queryKeys.markets });
      toast.success("Mercado creado", { description: market.name });
    },
    onError: (e: Error) => toast.error("No se pudo crear el mercado", { description: e.message }),
  });
}

export function useUpdateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarketInput }) => marketsService.update(id, input),
    onSuccess: (market) => {
      qc.invalidateQueries({ queryKey: queryKeys.markets });
      qc.invalidateQueries({ queryKey: queryKeys.market(market.id) });
      toast.success("Mercado actualizado", { description: market.name });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useSetMarketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RouteStatus }) =>
      marketsService.setStatus(id, status),
    onSuccess: (market) => {
      qc.invalidateQueries({ queryKey: queryKeys.markets });
      qc.invalidateQueries({ queryKey: queryKeys.market(market.id) });
      toast.success(market.status === "active" ? "Mercado activado" : "Mercado desactivado", {
        description: market.name,
      });
    },
    onError: (e: Error) => toast.error("No se pudo cambiar el estado", { description: e.message }),
  });
}

export function useDeleteMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.markets });
      toast.success("Mercado eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el mercado"),
  });
}
