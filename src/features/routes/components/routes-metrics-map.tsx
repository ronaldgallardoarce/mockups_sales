import { useMemo } from "react";
import { Marker, Polygon, Popup, Tooltip as LeafletTooltip } from "react-leaflet";
import { Route as RouteIcon } from "lucide-react";
import type { LatLng } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { channelColor, getChannel, getSubcanal } from "@/data/channels";
import { clientPinIcon } from "@/features/map/lib/leaflet-setup";
import { bs, type ClientMetric, type RouteMetric } from "../lib/route-metrics";

interface RoutesMetricsMapProps {
  routeMetrics: RouteMetric[];
  clientMetrics: ClientMetric[];
}

/** Map of route polygons with per-route and per-client sales/seller metrics. */
export function RoutesMetricsMap({ routeMetrics, clientMetrics }: RoutesMetricsMapProps) {
  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    routeMetrics.forEach(({ blocks }) => blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p))));
    return pts;
  }, [routeMetrics]);

  const hasRoutes = routeMetrics.some((rm) => rm.blocks.length > 0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {routeMetrics.map(({ route, blocks, clientCount, sellerCount, avgTicket, totalDrop }) =>
          blocks.map((block) => (
            <Polygon
              key={`${route.id}-${block.id}`}
              positions={block.polygon}
              pathOptions={{ color: route.color, weight: 2, fillColor: route.color, fillOpacity: 0.26 }}
            >
              <LeafletTooltip sticky>
                <div className="space-y-0.5">
                  <div className="font-semibold" style={{ color: route.color }}>{route.name}</div>
                  <div>{sellerCount} vendedor(es) · {clientCount} clientes</div>
                  <div>Ticket prom. {bs(avgTicket)}/mes</div>
                  <div>DropSize total {bs(totalDrop)}</div>
                </div>
              </LeafletTooltip>
            </Polygon>
          )),
        )}

        {clientMetrics.map(({ client, sellerCount }) => {
          const color = channelColor(client.channelId);
          return (
            <Marker key={client.id} position={[client.lat, client.lng]} icon={clientPinIcon(color)}>
              <Popup>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.code} · {client.ownerName}</p>
                  <p className="text-xs font-medium" style={{ color }}>
                    {getChannel(client.channelId)?.name} · {getSubcanal(client.subcanalId)?.name}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs">
                    <p>Ticket promedio: <span className="font-medium">{bs(client.ticketPromedio)}</span>/mes</p>
                    <p>DropSize: <span className="font-medium">{bs(client.dropSize)}</span>/visita</p>
                    <p>Atendido por <span className="font-medium">{sellerCount}</span> vendedor(es)</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds points={fitPoints} />
      </BaseMap>

      {!hasRoutes && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <RouteIcon className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">No hay rutas con manzanos para mostrar.</p>
        </div>
      )}
    </div>
  );
}
