import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Search, X } from "lucide-react";
import type { ClientTask, ClientTaskType, TaskStatus } from "@/types";
import { ALL_CLIENT_TASK_TYPES, CLIENT_TASK_TYPE_LABELS } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientTasksPaged, useDeleteClientTask } from "@/hooks/use-client-tasks";
import { ClientTasksTable } from "../components/client-tasks-table";
import { ClientTaskDetailSheet } from "../components/client-task-detail-sheet";

const PAGE_SIZE_OPTIONS = [8, 10, 20, 50];

export function ClientTasksListPage() {
  const navigate = useNavigate();
  const deleteTask = useDeleteClientTask();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [type, setType] = useState<ClientTaskType | "all">("all");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ClientTask | null>(null);
  const [toDelete, setToDelete] = useState<ClientTask | null>(null);

  // Server-side filtering: go back to page 1 whenever the filters/size change.
  useEffect(() => setPage(1), [search, status, type, pageSize]);

  const { data, isLoading, isFetching } = useClientTasksPaged({
    page,
    limit: pageSize,
    status,
    type,
    search,
  });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasFilters = search !== "" || status !== "all" || type !== "all";

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
        title="Tareas por Cliente"
        description="Define tareas recurrentes que aparecen en la ficha del cliente durante la visita."
      >
        <Button onClick={() => navigate("/client-tasks/new")}>
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as ClientTaskType | "all")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {ALL_CLIENT_TASK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {CLIENT_TASK_TYPE_LABELS[t]}
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
              setType("all");
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
              : "Crea tu primera tarea por cliente para empezar."
          }
          action={
            !hasFilters && (
              <Button onClick={() => navigate("/client-tasks/new")}>
                <Plus className="h-4 w-4" /> Nueva tarea
              </Button>
            )
          }
        />
      ) : (
        <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}>
          <ClientTasksTable
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

      <ClientTaskDetailSheet
        task={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar “${toDelete?.name}”?`}
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
