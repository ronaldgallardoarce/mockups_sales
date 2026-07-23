import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ClientTask, ClientTaskInput, ClientTaskType, TaskStatus } from "@/types";
import { clientTasksService, type ListClientTasksParams } from "@/services/client-tasks-service";
import { queryKeys } from "@/lib/query-client";

export function useClientTasks() {
  return useQuery({
    queryKey: queryKeys.clientTasks,
    queryFn: clientTasksService.list,
  });
}

export interface UseClientTasksPagedParams {
  page: number;
  limit: number;
  status: TaskStatus | "all";
  type: ClientTaskType | "all";
  search: string;
}

/** Paginated + filtered client tasks for the list view. Keeps prior page while fetching. */
export function useClientTasksPaged(params: UseClientTasksPagedParams) {
  return useQuery({
    queryKey: queryKeys.clientTasksPaged(params),
    queryFn: () => clientTasksService.listPaged(params as ListClientTasksParams),
    placeholderData: keepPreviousData,
  });
}

export function useClientTask(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.clientTask(id ?? "new"),
    queryFn: () => clientTasksService.get(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientTaskInput) => clientTasksService.create(input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks });
      toast.success("Tarea creada", { description: task.name });
    },
    onError: (e: Error) => toast.error("No se pudo crear la tarea", { description: e.message }),
  });
}

export function useUpdateClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ClientTaskInput }) =>
      clientTasksService.update(id, input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks });
      qc.invalidateQueries({ queryKey: queryKeys.clientTask(task.id) });
      toast.success("Tarea actualizada", { description: task.name });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useSetClientTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      clientTasksService.setStatus(id, status),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.clientTasks });
      qc.invalidateQueries({ queryKey: queryKeys.clientTask(task.id) });
      toast.success(task.status === "active" ? "Tarea activada" : "Tarea desactivada", {
        description: task.name,
      });
    },
    onError: (e: Error) => toast.error("No se pudo cambiar el estado", { description: e.message }),
  });
}

export function useDeleteClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientTasksService.remove(id),
    // Optimistic removal from the cached list.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.clientTasks });
      const previous = qc.getQueryData<ClientTask[]>(queryKeys.clientTasks);
      qc.setQueryData<ClientTask[]>(queryKeys.clientTasks, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.clientTasks, ctx.previous);
      toast.error("No se pudo eliminar la tarea");
    },
    onSuccess: () => toast.success("Tarea eliminada"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.clientTasks }),
  });
}
