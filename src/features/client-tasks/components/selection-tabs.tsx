import { useEffect, useMemo, useState } from "react";
import { Check, Layers, Route as RouteIcon, Search, Store, User, Users, X } from "lucide-react";
import type { Client, Market, Route } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorDot } from "@/components/common/channel-badge";
import { useAllSellers } from "@/hooks/use-sellers";
import { useClients } from "@/hooks/use-clients";
import { useBlocksStore } from "@/stores/blocks-store";
import { pointInPolygon } from "@/lib/geo";

/** One route row with its geographic client / manzano counts (built by the page). */
export interface RouteStat {
  route: Route;
  blockCount: number;
  clientCount: number;
}

interface SelectionTabsProps {
  routeStats: RouteStat[];
  routeSearch: string;
  onRouteSearchChange: (value: string) => void;
  /** Routes eligible under the current city/channel filters (for employee → routes). */
  filteredRoutes: Route[];
  selectedRouteIds: Set<string>;
  /** Toggle a single route (Rutas tab). */
  onToggleRoute: (id: string) => void;
  /** Add or remove a batch of routes at once (Empleados tab). */
  onSetRoutesSelected: (ids: string[], selected: boolean) => void;
  /** Manzanos currently in the target set (sources + manual − excluded). */
  targetBlockIds: Set<string>;
  /** Manzanos carved out of a source's contribution. */
  excludedBlockIds: Set<string>;
  /** Clears routes, markets and manzanos from the whole selection. */
  onClearAll: () => void;
  markets: Market[];
  selectedMarketIds: Set<string>;
  onToggleMarket: (market: Market) => void;
  /** Whether the Mercados tab is available (channel filter includes TRADICIONAL). */
  showMarketsTab: boolean;
}

/** Shared row shell: a full-width toggle button with a leading checkbox. */
function ToggleRow({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex w-full items-start gap-2.5 px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
        {children}
      </button>
    </li>
  );
}

export function SelectionTabs({
  routeStats,
  routeSearch,
  onRouteSearchChange,
  filteredRoutes,
  selectedRouteIds,
  onToggleRoute,
  onSetRoutesSelected,
  targetBlockIds,
  excludedBlockIds,
  onClearAll,
  markets,
  selectedMarketIds,
  onToggleMarket,
  showMarketsTab,
}: SelectionTabsProps) {
  const { data: sellers = [] } = useAllSellers();
  const { data: clients = [] } = useClients();
  const blocks = useBlocksStore((s) => s.blocks);

  const [active, setActive] = useState("rutas");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [marketSearch, setMarketSearch] = useState("");

  // If the Mercados tab disappears while it's active, fall back to Rutas.
  useEffect(() => {
    if (!showMarketsTab && active === "mercados") setActive("rutas");
  }, [showMarketsTab, active]);

  const hasSelection =
    selectedRouteIds.size > 0 || targetBlockIds.size > 0 || excludedBlockIds.size > 0;

  // Route ids visible under the current filters — sellers can only contribute these.
  const eligibleRouteIds = useMemo(
    () => new Set(filteredRoutes.map((r) => r.id)),
    [filteredRoutes],
  );

  // Per-seller eligible routes + whether they're all currently selected.
  const sellerRows = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    return sellers
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((seller) => {
        const routeIds = [
          ...new Set(
            seller.routeAssignments
              .map((a) => a.routeId)
              .filter((id) => eligibleRouteIds.has(id)),
          ),
        ];
        const allSelected = routeIds.length > 0 && routeIds.every((id) => selectedRouteIds.has(id));
        return { seller, routeIds, allSelected };
      });
  }, [sellers, employeeSearch, eligibleRouteIds, selectedRouteIds]);

  // Per-market clients that fall inside its manzanos (mirrors AssignMarketDialog).
  const clientsByMarket = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const m of markets) {
      const polys = blocks.filter((b) => m.blockIds.includes(b.id));
      map.set(
        m.id,
        clients.filter((c) => polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))),
      );
    }
    return map;
  }, [markets, blocks, clients]);

  const marketRows = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    return markets.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [markets, marketSearch]);

  return (
    <div className="flex max-h-[70vh] w-full flex-col overflow-hidden rounded-xl border bg-card xl:h-full xl:max-h-none xl:w-80 xl:shrink-0">
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            Selección
            {selectedRouteIds.size > 0 && (
              <span className="text-muted-foreground">({selectedRouteIds.size} ruta(s))</span>
            )}
          </span>
          {hasSelection && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>
        {targetBlockIds.size > 0 && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" /> {targetBlockIds.size} manzano(s) seleccionado(s)
          </p>
        )}
        {excludedBlockIds.size > 0 && (
          <p className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
            <X className="h-3 w-3" /> {excludedBlockIds.size} manzano(s) excluido(s)
          </p>
        )}
      </div>

      <Tabs value={active} onValueChange={setActive} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 w-fit">
          <TabsTrigger value="rutas">
            <RouteIcon className="h-3.5 w-3.5" /> Rutas
          </TabsTrigger>
          <TabsTrigger value="empleados">
            <Users className="h-3.5 w-3.5" /> Empleados
          </TabsTrigger>
          {showMarketsTab && (
            <TabsTrigger value="mercados">
              <Store className="h-3.5 w-3.5" /> Mercados
            </TabsTrigger>
          )}
        </TabsList>

        {/* ---- Rutas ---- */}
        <TabsContent value="rutas" className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={routeSearch}
                onChange={(e) => onRouteSearchChange(e.target.value)}
                placeholder="Buscar ruta…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-2">
            {routeStats.length === 0 ? (
              <li className="py-8 text-center text-xs text-muted-foreground">
                No hay rutas con los filtros actuales.
              </li>
            ) : (
              routeStats.map(({ route, clientCount, blockCount }) => (
                <ToggleRow
                  key={route.id}
                  selected={selectedRouteIds.has(route.id)}
                  onClick={() => onToggleRoute(route.id)}
                >
                  <ColorDot color={route.color} className="mt-1 h-3 w-3" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{route.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {clientCount} clientes · {blockCount} manzanos
                    </div>
                  </div>
                </ToggleRow>
              ))
            )}
          </ul>
        </TabsContent>

        {/* ---- Empleados ---- */}
        <TabsContent value="empleados" className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Buscar empleado…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-2">
            {sellerRows.length === 0 ? (
              <li className="py-8 text-center text-xs text-muted-foreground">Sin empleados.</li>
            ) : (
              sellerRows.map(({ seller, routeIds, allSelected }) => (
                <ToggleRow
                  key={seller.code}
                  selected={allSelected}
                  disabled={routeIds.length === 0}
                  onClick={() => onSetRoutesSelected(routeIds, !allSelected)}
                >
                  <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{seller.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {routeIds.length === 0
                        ? "Sin rutas en los filtros actuales"
                        : `${routeIds.length} ruta(s)`}
                    </div>
                  </div>
                </ToggleRow>
              ))
            )}
          </ul>
        </TabsContent>

        {/* ---- Mercados (solo canal TRADICIONAL) ---- */}
        {showMarketsTab && (
          <TabsContent value="mercados" className="mt-0 min-h-0 flex-1 flex-col data-[state=active]:flex">
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="Buscar mercado…"
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <ul className="flex-1 space-y-2 overflow-y-auto p-2">
              {marketRows.length === 0 ? (
                <li className="py-8 text-center text-xs text-muted-foreground">
                  {markets.length === 0 ? "Todavía no hay mercados." : "Sin coincidencias."}
                </li>
              ) : (
                marketRows.map((market) => {
                  const marketClients = clientsByMarket.get(market.id) ?? [];
                  return (
                    <ToggleRow
                      key={market.id}
                      selected={selectedMarketIds.has(market.id)}
                      onClick={() => onToggleMarket(market)}
                    >
                      <ColorDot color={market.color} className="mt-1 h-3 w-3" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{market.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{market.cityName ?? market.provinceName ?? "—"}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {marketClients.length}
                          </span>
                        </div>
                      </div>
                    </ToggleRow>
                  );
                })
              )}
            </ul>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
