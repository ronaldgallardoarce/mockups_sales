import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinned, Plus, Route as RouteIcon, Search, X } from "lucide-react";
import type { Route, RouteStatus } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useRoutesPaged } from "@/hooks/use-routes";
import { CHANNELS } from "@/data/channels";
import { RoutesTable } from "../components/routes-table";
import { RouteDetailSheet } from "../components/route-detail-sheet";

const PAGE_SIZE_OPTIONS = [8, 10, 20, 50];
const CHANNEL_OPTIONS = [
  { value: "all", label: "Todos los canales" },
  ...CHANNELS.map((c) => ({ value: c.id, label: c.name })),
];

export function RoutesListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RouteStatus | "all">("all");
  const [channel, setChannel] = useState("all");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Route | null>(null);

  // Server-side filtering: go back to page 1 whenever the filters/size change.
  useEffect(() => setPage(1), [search, status, channel, pageSize]);

  const { data, isLoading, isFetching } = useRoutesPaged({
    page,
    limit: pageSize,
    status,
    search,
    channel,
  });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasFilters = search !== "" || status !== "all" || channel !== "all";

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
        title="Rutas"
        description="Administra las rutas de pre-venta."
      >
        <Button variant="outline" onClick={() => navigate("/routes/map")}>
          <MapPinned className="h-4 w-4" /> Ver en mapa
        </Button>
        <Button onClick={() => navigate("/routes/new")}>
          <Plus className="h-4 w-4" /> Nueva ruta
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de ruta…"
            className="pl-9"
          />
        </div>
        <Combobox
          options={CHANNEL_OPTIONS}
          value={channel}
          onChange={setChannel}
          placeholder="Canal de venta"
          searchPlaceholder="Buscar canal…"
          className="w-full sm:w-52"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as RouteStatus | "all")}>
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
              setChannel("all");
            }}
          >
            <X className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

     

      {!isLoading && totalItems === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title={hasFilters ? "Sin resultados" : "Aún no hay rutas"}
          description={
            hasFilters
              ? "Ajusta la búsqueda o los filtros para encontrar rutas."
              : "Crea tu primera ruta de pre-venta para empezar."
          }
          action={
            !hasFilters && (
              <Button onClick={() => navigate("/routes/new")}>
                <Plus className="h-4 w-4" /> Nueva ruta
              </Button>
            )
          }
        />
      ) : (
        <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}>
          <RoutesTable routes={rows} loading={isLoading} onView={setDetail} />
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

      <RouteDetailSheet route={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} />
    </>
  );
}
