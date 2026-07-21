import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Seller, SellerRouteAssignment, SellerStatus } from "@/types";
import { sellersService, type ListSellersParams } from "@/services/sellers-service";
import { queryKeys } from "@/lib/query-client";

export interface UseSellersPagedParams {
  page: number;
  limit: number;
  status: SellerStatus | "all";
  search: string;
}

/** All sellers (for cross-cutting views like the routes metrics map). */
export function useAllSellers() {
  return useQuery({
    queryKey: queryKeys.sellers,
    queryFn: sellersService.list,
  });
}

/** Paginated + filtered sellers for the list view. Keeps prior page while fetching. */
export function useSellersPaged(params: UseSellersPagedParams) {
  return useQuery({
    queryKey: queryKeys.sellersPaged(params),
    queryFn: () => sellersService.listPaged(params as ListSellersParams),
    placeholderData: keepPreviousData,
  });
}

export function useSeller(code: number | undefined) {
  return useQuery({
    queryKey: queryKeys.seller(code ?? "new"),
    queryFn: () => sellersService.get(code as number),
    enabled: code !== undefined,
  });
}

export function useSellerDetail(code: number | undefined) {
  return useQuery({
    queryKey: queryKeys.sellerDetail(code ?? "new"),
    queryFn: () => sellersService.getDetail(code as number),
    enabled: code !== undefined,
  });
}

export function useUpdateSellerRoutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, routeAssignments }: { code: number; routeAssignments: SellerRouteAssignment[] }) =>
      sellersService.updateRoutes(code, routeAssignments),
    onSuccess: (seller: Seller) => {
      qc.invalidateQueries({ queryKey: queryKeys.sellers });
      qc.invalidateQueries({ queryKey: queryKeys.seller(seller.code) });
      toast.success("Rutas asignadas", { description: seller.name });
    },
    onError: (e: Error) => toast.error("No se pudo guardar la asignación", { description: e.message }),
  });
}
