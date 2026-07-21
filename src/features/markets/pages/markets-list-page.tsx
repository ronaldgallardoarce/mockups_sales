import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Check,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Store,
  Table2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { useMarkets, useSetMarketStatus } from "@/hooks/use-markets";
import { useClients } from "@/hooks/use-clients";
import { useBlocksStore } from "@/stores/blocks-store";
import { useRole, canEditMarkets } from "@/stores/session-store";
import { MarketsOverviewMap } from "../components/markets-overview-map";
import { MarketsTable } from "../components/markets-table";
import { bs, computeMarketMetrics } from "../lib/market-metrics";

const TABLE_PAGE_SIZE = 10;

export function MarketsListPage() {
  const navigate = useNavigate();
  const role = useRole();
  const canEdit = canEditMarkets(role);
  const { data: markets = [], isLoading } = useMarkets();
  const { data: clients = [] } = useClients();
  const blocks = useBlocksStore((s) => s.blocks);
  const setMarketStatus = useSetMarketStatus();

  const [view, setView] = useState<"table" | "map">("table");
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tablePage, setTablePage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markets.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [markets, search]);

  // ---- Table view pagination (front-end) ----
  useEffect(() => setTablePage(1), [search]);
  const tableTotalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const tp = Math.min(tablePage, tableTotalPages);
  const pagedMarkets = filtered.slice((tp - 1) * TABLE_PAGE_SIZE, tp * TABLE_PAGE_SIZE);

  // ---- Map view metrics ----
  const metrics = useMemo(
    () => computeMarketMetrics(filtered, clients, blocks),
    [filtered, clients, blocks],
  );
  const visibleMetrics = useMemo(
    () => (selectedIds.size ? metrics.filter((m) => selectedIds.has(m.market.id)) : metrics),
    [metrics, selectedIds],
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const searchBar = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar mercado…"
        className="pl-9"
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Gestión de Mercados"
        description={
          canEdit
            ? "Dibuja y administra los mercados y sus manzanos."
            : "Consulta los mercados con sus manzanos y clientes."
        }
      >
        <Button
          variant="outline"
          onClick={() => setView((v) => (v === "table" ? "map" : "table"))}
        >
          {view === "table" ? (
            <>
              <MapPinned className="h-4 w-4" /> Ver en mapa
            </>
          ) : (
            <>
              <Table2 className="h-4 w-4" /> Ver tabla
            </>
          )}
        </Button>
        {canEdit && (
          <Button onClick={() => navigate("/markets/new")}>
            <Plus className="h-4 w-4" /> Nuevo mercado
          </Button>
        )}
      </PageHeader>

      {view === "table" ? (
        /* ---- Table view (default) ---- */
        <div className="space-y-4">
          <div className="max-w-sm">{searchBar}</div>

          {!isLoading && filtered.length === 0 ? (
            <EmptyState
              icon={Store}
              title={search ? "Sin resultados" : "Aún no hay mercados"}
              description={
                search
                  ? "Ajusta la búsqueda."
                  : canEdit
                    ? "Crea tu primer mercado para empezar."
                    : "Todavía no se dibujaron mercados."
              }
              action={
                !search && canEdit ? (
                  <Button onClick={() => navigate("/markets/new")}>
                    <Plus className="h-4 w-4" /> Nuevo mercado
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <MarketsTable markets={pagedMarkets} loading={isLoading} canEdit={canEdit} />
              {filtered.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{filtered.length}</span> mercado(s)
                  </p>
                  <Pagination page={tp} totalPages={tableTotalPages} onPageChange={setTablePage} />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ---- Map view ---- */
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-3">
            {searchBar}

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-3 py-1.5 text-xs">
                <span className="font-medium text-primary">
                  {selectedIds.size} mercado(s) seleccionado(s)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Ver todos
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Store}
                title={search ? "Sin resultados" : "Aún no hay mercados"}
                description={search ? "Ajusta la búsqueda." : "Todavía no se dibujaron mercados."}
              />
            ) : (
              <ul className="space-y-1.5">
                {metrics.map(({ market, clientCount, avgTicket, totalDrop }) => {
                  const isSel = selectedIds.has(market.id);
                  const active = market.status === "active";
                  return (
                    <li
                      key={market.id}
                      onClick={() => toggleSelect(market.id)}
                      onMouseEnter={() => setHovered(market.id)}
                      onMouseLeave={() => setHovered((s) => (s === market.id ? null : s))}
                      className={cn(
                        "group flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        isSel
                          ? "border-primary/50 bg-primary/5"
                          : hovered === market.id
                            ? "border-primary/40 bg-primary/5"
                            : "hover:border-primary/30",
                        !active && "opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSel ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                      >
                        {isSel && <Check className="h-3 w-3" />}
                      </span>
                      <ColorDot color={market.color} className="mt-1 h-3.5 w-3.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{market.name}</span>
                          {!active && (
                            <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{market.cityName ?? market.provinceName ?? "—"}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{market.blockIds.length} manzanos</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{clientCount} clientes</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                          <span>Ticket <span className="font-medium tabular-nums text-foreground/80">{bs(avgTicket)}</span></span>
                          <span>Drop <span className="font-medium tabular-nums text-foreground/80">{bs(totalDrop)}</span></span>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/markets/${market.id}/edit`);
                            }}
                            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`Editar ${market.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMarketStatus.mutate({
                                id: market.id,
                                status: active ? "inactive" : "active",
                              });
                            }}
                            title={active ? "Desactivar mercado" : "Activar mercado"}
                            aria-label={active ? `Desactivar ${market.name}` : `Activar ${market.name}`}
                            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              {selectedIds.size > 0
                ? `Mostrando ${selectedIds.size} mercado(s) seleccionado(s)`
                : "Mercados con sus manzanos y clientes"}
            </div>
            <div className="h-[460px] lg:h-[calc(100%-2rem)]">
              <MarketsOverviewMap metrics={visibleMetrics} highlightedId={hovered} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
