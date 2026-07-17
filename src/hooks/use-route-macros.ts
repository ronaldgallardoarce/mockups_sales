import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RouteMacro, RouteMacroInput, RouteStatus } from "@/types";
import { routeMacrosService, type ListRouteMacrosParams } from "@/services/route-macros-service";
import { queryKeys } from "@/lib/query-client";

export function useRouteMacros() {
  return useQuery({
    queryKey: queryKeys.routeMacros,
    queryFn: routeMacrosService.list,
  });
}

export interface UseRouteMacrosPagedParams {
  page: number;
  limit: number;
  status: RouteStatus | "all";
  search: string;
}

/** Paginated + filtered macros for the list view. Keeps prior page while fetching. */
export function useRouteMacrosPaged(params: UseRouteMacrosPagedParams) {
  return useQuery({
    queryKey: queryKeys.routeMacrosPaged(params),
    queryFn: () => routeMacrosService.listPaged(params as ListRouteMacrosParams),
    placeholderData: keepPreviousData,
  });
}

export function useRouteMacro(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.routeMacro(id ?? "new"),
    queryFn: () => routeMacrosService.get(id as string),
    enabled: !!id,
  });
}

export function useCreateRouteMacro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RouteMacroInput) => routeMacrosService.create(input),
    onSuccess: (macro) => {
      qc.invalidateQueries({ queryKey: queryKeys.routeMacros });
      toast.success("Macroruta creada", { description: macro.name });
    },
    onError: (e: Error) => toast.error("No se pudo crear la macroruta", { description: e.message }),
  });
}

export function useUpdateRouteMacro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RouteMacroInput }) =>
      routeMacrosService.update(id, input),
    onSuccess: (macro) => {
      qc.invalidateQueries({ queryKey: queryKeys.routeMacros });
      qc.invalidateQueries({ queryKey: queryKeys.routeMacro(macro.id) });
      toast.success("Macroruta actualizada", { description: macro.name });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useDeleteRouteMacro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routeMacrosService.remove(id),
    // Optimistic removal from the cached list.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.routeMacros });
      const previous = qc.getQueryData<RouteMacro[]>(queryKeys.routeMacros);
      qc.setQueryData<RouteMacro[]>(queryKeys.routeMacros, (old) =>
        (old ?? []).filter((m) => m.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.routeMacros, ctx.previous);
      toast.error("No se pudo eliminar la macroruta");
    },
    onSuccess: () => toast.success("Macroruta eliminada"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.routeMacros }),
  });
}
