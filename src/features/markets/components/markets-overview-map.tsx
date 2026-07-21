import { useMemo } from "react";
import { Polygon, Tooltip as LeafletTooltip } from "react-leaflet";
import { Store } from "lucide-react";
import type { LatLng, Market } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClients } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

interface MarketsOverviewMapProps {
  markets: Market[];
  /** When set, only this market is emphasized (others dimmed). */
  highlightedId?: string | null;
}

/** Read-only overview: every market's manzanos in its own color, plus their clients. */
export function MarketsOverviewMap({ markets, highlightedId }: MarketsOverviewMapProps) {
  const allBlocks = useBlocksStore((s) => s.blocks);
  const { data: clients = [] } = useClients();

  const marketBlocks = useMemo(
    () =>
      markets.map((market) => ({
        market,
        blocks: allBlocks.filter((b) => market.blockIds.includes(b.id)),
      })),
    [markets, allBlocks],
  );

  const clientsInMarkets = useMemo(() => {
    const polys = marketBlocks.flatMap((mb) => mb.blocks);
    return clients.filter((c) => polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
  }, [clients, marketBlocks]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    marketBlocks.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    return pts;
  }, [marketBlocks]);

  const hasAreas = marketBlocks.some((mb) => mb.blocks.length > 0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {marketBlocks.map(({ market, blocks }) =>
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
                <LeafletTooltip sticky>{market.name}</LeafletTooltip>
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
