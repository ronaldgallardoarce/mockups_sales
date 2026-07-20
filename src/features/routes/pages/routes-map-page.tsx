import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Receipt, Route as RouteIcon, Search, ShoppingBag, Store, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { useRoutes } from "@/hooks/use-routes";
import { useClients } from "@/hooks/use-clients";
import { useAllSellers } from "@/hooks/use-sellers";
import { useBlocksStore } from "@/stores/blocks-store";
import { RoutesMetricsMap } from "../components/routes-metrics-map";
import { bs, computeRoutesMetrics } from "../lib/route-metrics";

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
  const blocks = useBlocksStore((s) => s.blocks);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Per-route stats for the side list (independent of the current selection).
  const allMetrics = useMemo(
    () => computeRoutesMetrics(routes, clients, sellers, blocks),
    [routes, clients, sellers, blocks],
  );

  // The map + summary reflect the selection (all routes when nothing selected).
  const visibleRoutes = useMemo(
    () => (selected.size ? routes.filter((r) => selected.has(r.id)) : routes),
    [routes, selected],
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
      </PageHeader>

      {loadingRoutes ? (
        <Skeleton className="h-[70vh] w-full rounded-xl" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={RouteIcon} label="Rutas" value={String(summary.routeCount)} />
            <StatCard icon={Users} label="Vendedores atendiendo" value={String(summary.sellerCount)} />
            <StatCard icon={Store} label="Clientes cubiertos" value={String(summary.clientCount)} />
            <StatCard icon={Receipt} label="Ticket promedio" value={`${bs(summary.avgTicket)}/mes`} />
            <StatCard icon={ShoppingBag} label="DropSize total" value={bs(summary.totalDrop)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* ---- Route selector list ---- */}
            <div className="flex h-[calc(100vh-20rem)] min-h-[440px] flex-col rounded-xl border bg-card">
              <div className="space-y-2 border-b p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Rutas {selected.size > 0 && <span className="text-muted-foreground">({selected.size})</span>}
                  </span>
                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Ver todas
                    </button>
                  )}
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
                  listRoutes.map(({ route, clientCount, sellerCount }) => {
                    const isSelected = selected.has(route.id);
                    return (
                      <li key={route.id}>
                        <button
                          type="button"
                          onClick={() => toggle(route.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                            isSelected ? "bg-primary/10" : "hover:bg-accent",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <ColorDot color={route.color} className="h-3 w-3" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{route.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {clientCount} clientes · {sellerCount} vend.
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* ---- Map ---- */}
            <div className="h-[calc(100vh-20rem)] min-h-[440px]">
              <RoutesMetricsMap routeMetrics={routeMetrics} clientMetrics={clientMetrics} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
