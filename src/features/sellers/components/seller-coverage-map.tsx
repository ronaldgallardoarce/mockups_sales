import { useMemo } from "react";
import { Marker, Polygon, Popup, Tooltip as LeafletTooltip } from "react-leaflet";
import { MapPinned } from "lucide-react";
import type { Client, LatLng, Route } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { FlyToClient } from "@/features/map/components/fly-to-client";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";
import { excludedPinIcon } from "@/features/map/lib/leaflet-setup";

interface SellerCoverageMapProps {
  /** Routes currently assigned (or about to be) — each drawn in its own `route.color`. */
  routes: Route[];
  /** Client to fly to and highlight on the map. */
  focusClient?: Client | null;
  /** Client ids excluded from the routes — drawn with an X pin. */
  excludedClientIds?: Set<string>;
  /** Client ids manually assigned despite falling outside the route polygons. */
  manualClientIds?: Set<string>;
  /** Toggle a client's excluded state (enables map popup actions). */
  onToggleExclude?: (client: Client) => void;
}

/** Read-only preview: every assigned route's manzanos in its own color, plus their clients. */
export function SellerCoverageMap({ routes, focusClient, excludedClientIds, manualClientIds, onToggleExclude }: SellerCoverageMapProps) {
  const allBlocks = useBlocksStore((s) => s.blocks);

  const allSubcanalIds = useMemo(
    () => Array.from(new Set(routes.flatMap((r) => r.subcanalIds))),
    [routes],
  );

  const { data: clients = [] } = useClientsBySubcanales(allSubcanalIds);

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

  // Split coverage clients: excluded render with an X pin; manually assigned
  // clients (outside the polygons) are added back as normal pins.
  const { includedClients, excludedClients } = useMemo(() => {
    const excluded = excludedClientIds ?? new Set<string>();
    const manual = manualClientIds ?? new Set<string>();
    const inCoverageIds = new Set(clientsInCoverage.map((c) => c.id));
    const manualOutside = clients.filter((c) => manual.has(c.id) && !inCoverageIds.has(c.id));
    return {
      includedClients: [...clientsInCoverage.filter((c) => !excluded.has(c.id)), ...manualOutside],
      excludedClients: clientsInCoverage.filter((c) => excluded.has(c.id)),
    };
  }, [clientsInCoverage, clients, excludedClientIds, manualClientIds]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    routeBlocks.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    includedClients.forEach((c) => pts.push([c.lat, c.lng]));
    excludedClients.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [routeBlocks, includedClients, excludedClients]);

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
        <ClientMarkers
          clients={includedClients}
          highlightedClientId={focusClient?.id}
          onExclude={onToggleExclude}
        />
        {excludedClients.map((client) => (
          <Marker key={client.id} position={[client.lat, client.lng]} icon={excludedPinIcon()}>
            <LeafletTooltip direction="top" offset={[0, -14]}>
              <div>
                <div className="font-medium">{client.name}</div>
                <div className="text-muted-foreground">Excluido de la ruta</div>
              </div>
            </LeafletTooltip>
            <Popup>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.code} · {client.ownerName}</p>
                <p className="text-xs font-medium text-destructive">Excluido de la ruta</p>
                {onToggleExclude && (
                  <button
                    type="button"
                    onClick={() => onToggleExclude(client)}
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Volver a incluir
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds points={fitPoints} />
        <FlyToClient client={focusClient} />
      </BaseMap>

      {!hasCoverage && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapPinned className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Este vendedor aún no tiene rutas asignadas.
          </p>
        </div>
      )}
    </div>
  );
}
