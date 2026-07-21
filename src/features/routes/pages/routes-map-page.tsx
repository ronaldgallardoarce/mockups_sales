import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, FilterX, PanelLeftClose, PanelLeftOpen, Receipt, Route as RouteIcon, Search, ShoppingBag, Store, UserPlus, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { useRoutes } from "@/hooks/use-routes";
import { useClients } from "@/hooks/use-clients";
import { useChannels } from "@/hooks/use-channels";
import { useAllSellers } from "@/hooks/use-sellers";
import { useBlocksStore } from "@/stores/blocks-store";
import { CITIES } from "@/data/locations";
import { RoutesMetricsMap } from "../components/routes-metrics-map";
import { ChannelMultiSelect } from "../components/channel-multiselect";
import { AssignSellersDialog } from "@/features/sellers/components/assign-sellers-dialog";
import { bs, computeRoutesMetrics } from "../lib/route-metrics";

const CITY_FILTER_OPTIONS = [
  { value: "", label: "Todas las ciudades" },
  ...CITIES.map((c) => ({ value: c.name, label: c.name })),
];

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export function RoutesMapPage() {
  const navigate = useNavigate();
  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();
  const { data: clients = [] } = useClients();
  const { data: sellers = [] } = useAllSellers();
  const { data: channels = [] } = useChannels();
  const blocks = useBlocksStore((s) => s.blocks);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cityFilter, setCityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  // Fullscreen wraps the map area (list + map) so the list can float over the map.
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);
  useEffect(() => {
    const onChange = () => setIsMapFullscreen(document.fullscreenElement === mapAreaRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const hasFilters = cityFilter !== "" || channelFilter.length > 0;

  // City + channel filters scope every downstream view (list, map, summary).
  const filteredRoutes = useMemo(
    () =>
      routes.filter(
        (r) =>
          (cityFilter === "" || r.cityName === cityFilter) &&
          (channelFilter.length === 0 || r.channelIds.some((c) => channelFilter.includes(c))),
      ),
    [routes, cityFilter, channelFilter],
  );

  // Per-route stats for the side list (independent of the current selection).
  const allMetrics = useMemo(
    () => computeRoutesMetrics(filteredRoutes, clients, sellers, blocks),
    [filteredRoutes, clients, sellers, blocks],
  );

  // The map + summary reflect the selection (all filtered routes when none selected).
  const visibleRoutes = useMemo(
    () => (selected.size ? filteredRoutes.filter((r) => selected.has(r.id)) : filteredRoutes),
    [filteredRoutes, selected],
  );
  const { routeMetrics, clientMetrics, summary } = useMemo(
    () => computeRoutesMetrics(visibleRoutes, clients, sellers, blocks),
    [visibleRoutes, clients, sellers, blocks],
  );

  const q = search.trim().toLowerCase();
  const listRoutes = allMetrics.routeMetrics.filter((rm) => !q || rm.route.name.toLowerCase().includes(q));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader title="Rutas en el mapa" description="Cobertura, ventas y vendedores por ruta.">
        <Button variant="outline" onClick={() => navigate("/routes")}>
          <ArrowLeft className="h-4 w-4" /> Volver a rutas
        </Button>
        <Button onClick={() => setAssignOpen(true)}>
          <UserPlus className="h-4 w-4" /> Asignar vendedores
        </Button>
      </PageHeader>

      {loadingRoutes ? (
        <Skeleton className="h-[70vh] w-full rounded-xl" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={RouteIcon} label="Rutas" value={String(summary.routeCount)} />
            <StatCard icon={Users} label="Vendedores atendiendo" value={String(summary.sellerCount)} />
            <StatCard icon={Store} label="Clientes cubiertos" value={String(summary.clientCount)} />
            <StatCard icon={Receipt} label="Ticket promedio" value={`${bs(summary.avgTicket)}/mes`} />
            <StatCard icon={ShoppingBag} label="DropSize total" value={bs(summary.totalDrop)} />
          </div>

          {/* ---- Filters (below KPIs): scope the list, map and summary ---- */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
              <Combobox
                options={CITY_FILTER_OPTIONS}
                value={cityFilter}
                onChange={setCityFilter}
                placeholder="Todas las ciudades"
                searchPlaceholder="Buscar ciudad…"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Canal de venta</label>
              <ChannelMultiSelect channels={channels} value={channelFilter} onChange={setChannelFilter} />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="sm:mt-5"
                onClick={() => {
                  setCityFilter("");
                  setChannelFilter([]);
                }}
              >
                <FilterX className="h-4 w-4" /> Limpiar
              </Button>
            )}
          </div>

          <div
            ref={mapAreaRef}
            className={cn(
              "relative flex gap-4",
              isMapFullscreen ? "h-full w-full bg-background p-3" : "min-h-[440px] flex-1",
            )}
          >
            {/* ---- Route list: left column normally, floating collapsible panel in fullscreen ---- */}
            {isMapFullscreen && listCollapsed ? (
              <button
                type="button"
                onClick={() => setListCollapsed(false)}
                title="Mostrar lista de rutas"
                className="absolute left-6 top-6 z-[1000] flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-2 text-xs font-medium shadow-lg transition-colors hover:bg-accent"
              >
                <PanelLeftOpen className="h-4 w-4 shrink-0" /> Rutas
              </button>
            ) : (
              <div
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-card",
                  isMapFullscreen
                    ? "absolute left-6 top-6 z-[1000] max-h-[calc(100%-6.5rem)] w-80 shadow-2xl"
                    : "h-full w-80 shrink-0",
                )}
              >
                <div className="space-y-2 border-b p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Rutas {selected.size > 0 && <span className="text-muted-foreground">({selected.size})</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      {selected.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelected(new Set())}
                          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Ver todas
                        </button>
                      )}
                      {/* Collapsing only applies while the map is fullscreen. */}
                      {isMapFullscreen && (
                        <button
                          type="button"
                          onClick={() => setListCollapsed(true)}
                          title="Colapsar lista"
                          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <PanelLeftClose className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar ruta…"
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                </div>

                <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
                  {listRoutes.length === 0 ? (
                    <li className="py-8 text-center text-xs text-muted-foreground">Sin coincidencias.</li>
                  ) : (
                    listRoutes.map(({ route, clientCount, sellerCount, avgTicket, totalDrop }) => {
                      const isSelected = selected.has(route.id);
                      return (
                        <li key={route.id}>
                          <button
                            type="button"
                            onClick={() => toggle(route.id)}
                            className={cn(
                              "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-accent",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <ColorDot color={route.color} className="mt-1 h-3 w-3" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{route.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {clientCount} clientes · {sellerCount} vend.
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                                <span>Ticket <span className="font-medium tabular-nums text-foreground/80">{bs(avgTicket)}</span></span>
                                <span>Drop <span className="font-medium tabular-nums text-foreground/80">{bs(totalDrop)}</span></span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}

            {/* ---- Map ---- */}
            <div className="h-full min-w-0 flex-1">
              <RoutesMetricsMap
                routeMetrics={routeMetrics}
                clientMetrics={clientMetrics}
                fullscreenTargetRef={mapAreaRef}
              />
            </div>
          </div>
        </div>
      )}

      <AssignSellersDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        routes={filteredRoutes}
        allRoutes={routes}
        sellers={sellers}
        clients={clients}
        blocks={blocks}
      />
    </>
  );
}
