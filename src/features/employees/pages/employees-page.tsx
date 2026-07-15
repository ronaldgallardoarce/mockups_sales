import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, X } from "lucide-react";
import type { Employee, EmployeeStatus } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeesPaged } from "@/hooks/use-employees";
import { EmployeesTable } from "../components/employees-table";

const PAGE_SIZE_OPTIONS = [8, 10, 20, 50];

export function EmployeesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "all">("all");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, status, pageSize]);

  const { data, isLoading, isFetching } = useEmployeesPaged({ page, limit: pageSize, status, search });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasFilters = search !== "" || status !== "all";

  useEffect(() => {
    if (pagination && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [pagination, page]);

  const range = useMemo(() => {
    if (totalItems === 0) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return { start, end };
  }, [page, pageSize, totalItems]);

  const goToAssign = (employee: Employee) => navigate(`/employees/${employee.id}/assign`);

  return (
    <>
      <PageHeader title="Empleados" description="Vendedores y su asignación de rutas de pre-venta." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o correo…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
          >
            <X className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      {!isLoading && totalItems === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "Sin resultados" : "Aún no hay empleados"}
          description={
            hasFilters
              ? "Ajusta la búsqueda o los filtros para encontrar empleados."
              : "Los empleados registrados aparecerán aquí."
          }
        />
      ) : (
        <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}>
          <EmployeesTable employees={rows} loading={isLoading} onAssignRoute={goToAssign} />
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
    </>
  );
}
