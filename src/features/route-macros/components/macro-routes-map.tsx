import { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import type { LatLng, Route } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { ColorDot } from "@/components/common/channel-badge";
import { useBlocksStore } from "@/stores/blocks-store";

interface MacroRoutesMapProps {
  /** Routes that compose the macro; each is painted in its own color. */
  routes: Route[];
}

/**
 * Read-only preview of a macroruta: every route's manzanos rendered in the
 * route's own color, so overlapping coverage is easy to spot at a glance.
 */
export function MacroRoutesMap({ routes }: MacroRoutesMapProps) {
  const allBlocks = useBlocksStore((s) => s.blocks);

  // Per-route blocks, resolved from the shared blocks store.
  const layers = useMemo(
    () =>
      routes.map((route) => ({
        route,
        blocks: allBlocks.filter((b) => route.blockIds.includes(b.id)),
      })),
    [routes, allBlocks],
  );

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    layers.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    return pts;
  }, [layers]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {layers.map(({ route, blocks }) => (
          <BlockPolygons key={route.id} blocks={blocks} color={route.color} />
        ))}
        <FitBounds points={fitPoints} />
      </BaseMap>

      {/* Route legend */}
      {routes.length > 0 && (
        <div className="absolute left-3 top-3 z-[400] max-h-[70%] max-w-[220px] space-y-1 overflow-y-auto rounded-lg border bg-background/95 p-2 text-xs shadow-sm backdrop-blur">
          {routes.map((route) => (
            <div key={route.id} className="flex items-center gap-2">
              <ColorDot color={route.color} className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{route.name}</span>
            </div>
          ))}
        </div>
      )}

      {routes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapIcon className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Selecciona rutas para ver sus manzanos en el mapa.
          </p>
        </div>
      )}
    </div>
  );
}
