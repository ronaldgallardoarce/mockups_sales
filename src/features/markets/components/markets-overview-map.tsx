import { useMemo } from "react";
import { Polygon, Tooltip as LeafletTooltip } from "react-leaflet";
import { Store } from "lucide-react";
import type { LatLng } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { useClients } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";
import { bs, type MarketMetric } from "../lib/market-metrics";

interface MarketsOverviewMapProps {
  metrics: MarketMetric[];
  /** When set, only this market is emphasized (others dimmed). */
  highlightedId?: string | null;
}

/** Read-only overview: every market's manzanos in its own color, plus their clients. */
export function MarketsOverviewMap({ metrics, highlightedId }: MarketsOverviewMapProps) {
  const { data: clients = [] } = useClients();

  const clientsInMarkets = useMemo(() => {
    const polys = metrics.flatMap((m) => m.blocks);
    return clients.filter((c) => polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
  }, [clients, metrics]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    metrics.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    return pts;
  }, [metrics]);

  const hasAreas = metrics.some((m) => m.blocks.length > 0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {metrics.map(({ market, blocks, clientCount, avgTicket, totalDrop }) =>
          blocks.map((block) => {
            const dim = highlightedId != null && highlightedId !== market.id;
            return (
              <Polygon
                key={`${market.id}-${block.id}`}
                positions={block.polygon}
                pathOptions={{
                  color: market.color,
                  weight: 2,
                  fillColor: market.color,
                  fillOpacity: dim ? 0.08 : 0.28,
                  opacity: dim ? 0.4 : 1,
                }}
              >
                <LeafletTooltip sticky>
                  <div className="space-y-0.5">
                    <div className="font-semibold" style={{ color: market.color }}>{market.name}</div>
                    <div>{clientCount} clientes · {market.blockIds.length} manzanos</div>
                    <div>Ticket prom. {bs(avgTicket)}/mes</div>
                    <div>DropSize total {bs(totalDrop)}</div>
                  </div>
                </LeafletTooltip>
              </Polygon>
            );
          }),
        )}
        <ClientMarkers clients={clientsInMarkets} />
        <FitBounds points={fitPoints} />
      </BaseMap>

      {!hasAreas && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <Store className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">Aún no hay mercados dibujados.</p>
        </div>
      )}
    </div>
  );
}
