import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GeneralTask, GeneralTaskInput, TaskPriority, TaskStatus } from "@/types";
import { generalTasksService, type ListGeneralTasksParams } from "@/services/general-tasks-service";
import { queryKeys } from "@/lib/query-client";

export function useGeneralTasks() {
  return useQuery({
    queryKey: queryKeys.generalTasks,
    queryFn: generalTasksService.list,
  });
}

export interface UseGeneralTasksPagedParams {
  page: number;
  limit: number;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  search: string;
}

/** Paginated + filtered tasks for the list view. Keeps prior page while fetching. */
export function useGeneralTasksPaged(params: UseGeneralTasksPagedParams) {
  return useQuery({
    queryKey: queryKeys.generalTasksPaged(params),
    queryFn: () => generalTasksService.listPaged(params as ListGeneralTasksParams),
    placeholderData: keepPreviousData,
  });
}

export function useGeneralTask(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.generalTask(id ?? "new"),
    queryFn: () => generalTasksService.get(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateGeneralTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GeneralTaskInput) => generalTasksService.create(input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.generalTasks });
      toast.success("Tarea creada", { description: task.title });
    },
    onError: (e: Error) => toast.error("No se pudo crear la tarea", { description: e.message }),
  });
}

export function useUpdateGeneralTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: GeneralTaskInput }) =>
      generalTasksService.update(id, input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.generalTasks });
      qc.invalidateQueries({ queryKey: queryKeys.generalTask(task.id) });
      toast.success("Tarea actualizada", { description: task.title });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useSetGeneralTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      generalTasksService.setStatus(id, status),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.generalTasks });
      qc.invalidateQueries({ queryKey: queryKeys.generalTask(task.id) });
      toast.success(task.status === "active" ? "Tarea activada" : "Tarea desactivada", {
        description: task.title,
      });
    },
    onError: (e: Error) => toast.error("No se pudo cambiar el estado", { description: e.message }),
  });
}

export function useDeleteGeneralTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => generalTasksService.remove(id),
    // Optimistic removal from the cached list.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.generalTasks });
      const previous = qc.getQueryData<GeneralTask[]>(queryKeys.generalTasks);
      qc.setQueryData<GeneralTask[]>(queryKeys.generalTasks, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.generalTasks, ctx.previous);
      toast.error("No se pudo eliminar la tarea");
    },
    onSuccess: () => toast.success("Tarea eliminada"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.generalTasks }),
  });
}
