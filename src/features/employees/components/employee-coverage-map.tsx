import { useMemo } from "react";
import { Polygon, Tooltip as LeafletTooltip } from "react-leaflet";
import { MapPinned } from "lucide-react";
import type { LatLng, Route } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClients } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

interface EmployeeCoverageMapProps {
  /** Routes currently assigned (or about to be) — each drawn in its own `route.color`. */
  routes: Route[];
}

/** Read-only preview: every assigned route's manzanos in its own color, plus their clients. */
export function EmployeeCoverageMap({ routes }: EmployeeCoverageMapProps) {
  const allBlocks = useBlocksStore((s) => s.blocks);
  const { data: clients = [] } = useClients();

  const routeBlocks = useMemo(
    () =>
      routes.map((route) => ({
        route,
        blocks: allBlocks.filter((b) => route.blockIds.includes(b.id)),
      })),
    [routes, allBlocks],
  );

  const clientsInCoverage = useMemo(() => {
    const polys = routeBlocks.flatMap((rb) => rb.blocks);
    return clients.filter((c) => polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
  }, [clients, routeBlocks]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    routeBlocks.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    clientsInCoverage.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [routeBlocks, clientsInCoverage]);

  const hasCoverage = routeBlocks.some((rb) => rb.blocks.length > 0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {routeBlocks.map(({ route, blocks }) =>
          blocks.map((block) => (
            <Polygon
              key={`${route.id}-${block.id}`}
              positions={block.polygon}
              pathOptions={{
                color: route.color,
                weight: 2,
                fillColor: route.color,
                fillOpacity: 0.28,
              }}
            >
              <LeafletTooltip sticky>{route.name}</LeafletTooltip>
            </Polygon>
          )),
        )}
        <ClientMarkers clients={clientsInCoverage} />
        <FitBounds points={fitPoints} />
      </BaseMap>

      {!hasCoverage && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapPinned className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Este empleado aún no tiene rutas asignadas.
          </p>
        </div>
      )}
    </div>
  );
}
