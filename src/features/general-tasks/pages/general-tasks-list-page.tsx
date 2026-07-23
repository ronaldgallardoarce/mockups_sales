import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Search, X } from "lucide-react";
import type { GeneralTask, TaskPriority, TaskStatus } from "@/types";
import { ALL_TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteGeneralTask, useGeneralTasksPaged } from "@/hooks/use-general-tasks";
import { GeneralTasksTable } from "../components/general-tasks-table";
import { GeneralTaskDetailSheet } from "../components/general-task-detail-sheet";

const PAGE_SIZE_OPTIONS = [8, 10, 20, 50];

export function GeneralTasksListPage() {
  const navigate = useNavigate();
  const deleteTask = useDeleteGeneralTask();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<GeneralTask | null>(null);
  const [toDelete, setToDelete] = useState<GeneralTask | null>(null);

  // Server-side filtering: go back to page 1 whenever the filters/size change.
  useEffect(() => setPage(1), [search, status, priority, pageSize]);

  const { data, isLoading, isFetching } = useGeneralTasksPaged({
    page,
    limit: pageSize,
    status,
    priority,
    search,
  });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasFilters = search !== "" || status !== "all" || priority !== "all";

  // Keep the current page valid if the total shrinks (e.g. after a delete).
  useEffect(() => {
    if (pagination && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [pagination, page]);

  const range = useMemo(() => {
    if (totalItems === 0) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return { start, end };
  }, [page, pageSize, totalItems]);

  return (
    <>
      <PageHeader
        title="Tareas Generales"
        description="Asigna tareas puntuales a los vendedores con prioridad y fecha de vencimiento."
      >
        <Button onClick={() => navigate("/general-tasks/new")}>
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción…"
            className="pl-9"
          />
        </div>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            {ALL_TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPriority("all");
            }}
          >
            <X className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      {!isLoading && totalItems === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? "Sin resultados" : "Aún no hay tareas"}
          description={
            hasFilters
              ? "Ajusta la búsqueda o los filtros para encontrar tareas."
              : "Crea tu primera tarea general para asignarla a los vendedores."
          }
          action={
            !hasFilters && (
              <Button onClick={() => navigate("/general-tasks/new")}>
                <Plus className="h-4 w-4" /> Nueva tarea
              </Button>
            )
          }
        />
      ) : (
        <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}>
          <GeneralTasksTable
            tasks={rows}
            loading={isLoading}
            onView={setDetail}
            onDelete={setToDelete}
          />
        </div>
      )}

      {totalItems > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filas por página</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {range && (
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium text-foreground">
                  {range.start}–{range.end}
                </span>{" "}
                de <span className="font-medium text-foreground">{totalItems}</span>
              </p>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <GeneralTaskDetailSheet
        task={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar “${toDelete?.title}”?`}
        description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente."
        confirmLabel="Eliminar"
        destructive
        loading={deleteTask.isPending}
        onConfirm={() => {
          if (toDelete) {
            deleteTask.mutate(toDelete.id);
            setToDelete(null);
          }
        }}
      />
    </>
  );
}
