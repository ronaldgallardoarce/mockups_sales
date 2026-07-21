import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Pencil, Receipt, ShoppingBag, Store, Users } from "lucide-react";
import type { Route } from "@/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChannelBadge, ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "./status-badge";
import { RouteMapPreview } from "./route-map-preview";
import { getChannel, getSubcanal, groupSubcanalesByChannel } from "@/data/channels";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { useMarkets } from "@/hooks/use-markets";
import { pointInPolygon } from "@/lib/geo";
import { bs } from "../lib/route-metrics";

interface RouteDetailSheetProps {
  route: Route | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouteDetailSheet({ route, open, onOpenChange }: RouteDetailSheetProps) {
  const navigate = useNavigate();
  const allBlocks = useBlocksStore((s) => s.blocks);
  const { data: clients = [] } = useClientsBySubcanales(route?.subcanalIds ?? []);
  const { data: markets = [] } = useMarkets();
  // When set, the map + metrics show only this market's manzanos within the route.
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Reset the market filter whenever a different route is opened.
  useEffect(() => setSelectedMarketId(null), [route?.id]);

  const routeMarkets = useMemo(
    () => (route ? markets.filter((m) => route.marketIds?.includes(m.id)) : []),
    [markets, route],
  );

  // Manzanos shown: the whole route, or just the selected market's (within the route).
  const previewBlockIds = useMemo(() => {
    if (!route) return [];
    if (selectedMarketId) {
      const m = markets.find((mk) => mk.id === selectedMarketId);
      if (m) return m.blockIds.filter((b) => route.blockIds.includes(b));
    }
    return route.blockIds;
  }, [route, selectedMarketId, markets]);

  // Sales potential from the clients inside the shown manzanos.
  const metrics = useMemo(() => {
    const scopeBlocks = allBlocks.filter((b) => previewBlockIds.includes(b.id));
    const inside = clients.filter((c) => scopeBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
    const avgTicket = inside.length
      ? Math.round(inside.reduce((a, c) => a + c.ticketPromedio, 0) / inside.length)
      : 0;
    const totalDrop = inside.reduce((a, c) => a + c.dropSize, 0);
    return { avgTicket, totalDrop, clientCount: inside.length };
  }, [previewBlockIds, clients, allBlocks]);

  if (!route) return null;

  const selectedMarket = routeMarkets.find((m) => m.id === selectedMarketId) ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <div className="flex items-center gap-2">
            <ColorDot color={route.color} className="h-4 w-4" />
            <SheetTitle className="text-xl">{route.name}</SheetTitle>
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={route.status} />
            <span className="inline-flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" /> {metrics.clientCount} clientes
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-6">
          <section className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border p-2.5">
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" /> Ticket promedio
              </p>
              <p className="text-sm font-semibold tabular-nums">{bs(metrics.avgTicket)}/mes</p>
            </div>
            <div className="rounded-lg border p-2.5">
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShoppingBag className="h-3.5 w-3.5" /> DropSize total
              </p>
              <p className="text-sm font-semibold tabular-nums">{bs(metrics.totalDrop)}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Canales de venta
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {route.channelIds.map((id) => (
                <ChannelBadge key={id} channelId={id} />
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subcanales
            </h4>
            <div className="space-y-2">
              {groupSubcanalesByChannel(route.subcanalIds).map(({ channelId, ids }) => {
                const channel = getChannel(channelId);
                return (
                  <div key={channelId} className="space-y-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <ColorDot color={channel?.color ?? "#64748b"} className="h-2 w-2" />
                      {channel?.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ids.map((id) => (
                        <span
                          key={id}
                          className="rounded-full border px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: channel?.color,
                            borderColor: `${channel?.color}55`,
                            backgroundColor: `${channel?.color}14`,
                          }}
                        >
                          {getSubcanal(id)?.name ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {routeMarkets.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Store className="h-3.5 w-3.5" /> Mercados
                </h4>
                {selectedMarketId && (
                  <button
                    type="button"
                    onClick={() => setSelectedMarketId(null)}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ver toda la ruta
                  </button>
                )}
              </div>
              <ul className="space-y-1.5">
                {routeMarkets.map((m) => {
                  const isSel = selectedMarketId === m.id;
                  const count = m.blockIds.filter((b) => route.blockIds.includes(b)).length;
                  return (
                    <li
                      key={m.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                        isSel && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <ColorDot color={m.color} className="h-3.5 w-3.5" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.cityName ?? m.provinceName ?? "—"} · {count} manzanos
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMarketId(isSel ? null : m.id)}
                        title={isSel ? "Ver toda la ruta" : "Ver solo este mercado"}
                        aria-label={isSel ? "Ver toda la ruta" : `Ver solo ${m.name}`}
                        className={cn(
                          "shrink-0 rounded-sm p-1 transition-colors",
                          isSel
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {isSel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cobertura
              </h4>
              {selectedMarket && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Store className="h-3 w-3" /> {selectedMarket.name}
                </span>
              )}
            </div>
            <div className="h-64">
              <RouteMapPreview
                blockIds={previewBlockIds}
                subcanalIds={route.subcanalIds}
                color={selectedMarket?.color ?? route.color}
              />
            </div>
          </section>

          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(`/routes/${route.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar ruta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
