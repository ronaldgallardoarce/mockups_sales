import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Route, RouteInput, RouteStatus } from "@/types";
import { routesService, type ListRoutesParams } from "@/services/routes-service";
import { queryKeys } from "@/lib/query-client";

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: routesService.list,
  });
}

export interface UseRoutesPagedParams {
  page: number;
  limit: number;
  status: RouteStatus | "all";
  search: string;
}

/** Paginated + filtered routes for the list view. Keeps prior page while fetching. */
export function useRoutesPaged(params: UseRoutesPagedParams) {
  return useQuery({
    queryKey: queryKeys.routesPaged(params),
    queryFn: () => routesService.listPaged(params as ListRoutesParams),
    placeholderData: keepPreviousData,
  });
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.route(id ?? "new"),
    queryFn: () => routesService.get(id as string),
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RouteInput) => routesService.create(input),
    onSuccess: (route) => {
      qc.invalidateQueries({ queryKey: queryKeys.routes });
      toast.success("Ruta creada", { description: route.name });
    },
    onError: (e: Error) => toast.error("No se pudo crear la ruta", { description: e.message }),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RouteInput }) =>
      routesService.update(id, input),
    onSuccess: (route) => {
      qc.invalidateQueries({ queryKey: queryKeys.routes });
      qc.invalidateQueries({ queryKey: queryKeys.route(route.id) });
      toast.success("Ruta actualizada", { description: route.name });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routesService.remove(id),
    // Optimistic removal from the cached list.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.routes });
      const previous = qc.getQueryData<Route[]>(queryKeys.routes);
      qc.setQueryData<Route[]>(queryKeys.routes, (old) =>
        (old ?? []).filter((r) => r.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.routes, ctx.previous);
      toast.error("No se pudo eliminar la ruta");
    },
    onSuccess: () => toast.success("Ruta eliminada"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.routes }),
  });
}
