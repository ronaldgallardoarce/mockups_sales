import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { LatLng } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

interface RouteMapPreviewProps {
  /** Manzanos that compose the route. */
  blockIds: string[];
  /** Subcanales that compose the route — only clients in these are shown. */
  subcanalIds: string[];
  color?: string;
}

/** Read-only preview: the route's manzanos and the clients inside them. */
export function RouteMapPreview({ blockIds, subcanalIds, color }: RouteMapPreviewProps) {
  const allBlocks = useBlocksStore((s) => s.blocks);
  const { data: clients = [] } = useClientsBySubcanales(subcanalIds);

  const blocks = useMemo(
    () => allBlocks.filter((b) => blockIds.includes(b.id)),
    [allBlocks, blockIds],
  );

  const clientsInSelected = useMemo(
    () => clients.filter((c) => blocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))),
    [clients, blocks],
  );

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p)));
    clientsInSelected.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [blocks, clientsInSelected]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        <BlockPolygons blocks={blocks} color={color} />
        <ClientMarkers clients={clientsInSelected} />
        <FitBounds points={fitPoints} />
      </BaseMap>

      {blockIds.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[220px] text-sm text-muted-foreground">
            Esta ruta aún no tiene manzanos asignados.
          </p>
        </div>
      )}
    </div>
  );
}
