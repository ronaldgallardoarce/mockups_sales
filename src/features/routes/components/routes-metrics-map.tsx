import { useMemo } from "react";
import { Marker, Polygon, Popup, Tooltip as LeafletTooltip } from "react-leaflet";
import { Route as RouteIcon } from "lucide-react";
import type { Block, LatLng } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { channelColor, getChannel, getSubcanal } from "@/data/channels";
import { clientPinIcon, sellerPinIcon } from "@/features/map/lib/leaflet-setup";
import { pointInPolygon } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { bs, type ClientMetric, type RouteMetric } from "../lib/route-metrics";

/** First-two-word initials of a seller name, e.g. "Ana María López" → "AM". */
function sellerInitials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Geometric center of a single manzano — guaranteed to sit inside it. */
function blockCentroid(block: Block): LatLng {
  const p = block.polygon;
  const lat = p.reduce((a, x) => a + x[0], 0) / p.length;
  const lng = p.reduce((a, x) => a + x[1], 0) / p.length;
  return [lat, lng];
}

/** Overall center across all of a route's manzanos (for ranking, not placement). */
function routeCentroid(rm: RouteMetric): LatLng | null {
  const pts = rm.blocks.flatMap((b) => b.polygon);
  if (pts.length === 0) return null;
  const lat = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const lng = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return [lat, lng];
}

/** Amber, used to flag a manzano shared by more than one route. */
const SHARED_COLOR = "#f59e0b";

interface RoutesMetricsMapProps {
  routeMetrics: RouteMetric[];
  clientMetrics: ClientMetric[];
  fullscreenTargetRef?: React.RefObject<HTMLElement>;
  /** Show a seller (person) marker per route — used when a route is selected. */
  showSellers?: boolean;
}

/** Map of route polygons with per-route and per-client sales/seller metrics. */
export function RoutesMetricsMap({ routeMetrics, clientMetrics, fullscreenTargetRef, showSellers = false }: RoutesMetricsMapProps) {
  // Seller markers: one per route with sellers, anchored inside one of the
  // route's manzanos and spread apart so markers of different selected routes
  // don't stack on top of each other.
  const sellerMarkers = useMemo(() => {
    if (!showSellers) return [];
    const withSellers = routeMetrics.filter((rm) => rm.sellers.length > 0 && rm.blocks.length > 0);

    // How many selected routes include each manzano — lets us prefer a manzano
    // unique to a route so its marker naturally lands away from the others.
    const blockUse = new Map<string, number>();
    for (const rm of withSellers) for (const b of rm.blocks) blockUse.set(b.id, (blockUse.get(b.id) ?? 0) + 1);

    const dist = (a: LatLng, b: LatLng) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const TOO_CLOSE = 0.0006; // ~60 m: closer than this, two markers would overlap
    const NUDGE = 0.0009;
    const placed: LatLng[] = [];

    return withSellers.map((rm) => {
      const rc = routeCentroid(rm)!; // non-null: rm.blocks is non-empty
      // Prefer a manzano unique to this route; among candidates, the one whose
      // center is closest to the route's overall center (keeps it central).
      const unique = rm.blocks.filter((b) => (blockUse.get(b.id) ?? 0) === 1);
      const candidates = (unique.length ? unique : rm.blocks).map(blockCentroid);
      const base = candidates.sort((a, b) => dist(a, rc) - dist(b, rc))[0];

      // Best-effort spread from already-placed markers (golden-angle offsets).
      let center = base;
      for (let i = 1; placed.some((p) => dist(p, center) < TOO_CLOSE) && i <= 8; i++) {
        const ang = (i * 137.5 * Math.PI) / 180;
        const r = NUDGE * i * 0.6;
        center = [base[0] + Math.sin(ang) * r, base[1] + Math.cos(ang) * r];
      }
      placed.push(center);
      return { rm, center };
    });
  }, [routeMetrics, showSellers]);
  // Group by manzano: a block can belong to several routes, so we draw it once
  // and list every route that shares it (instead of stacking overlapping polygons).
  // Ticket/drop are computed at the manzano level — over the clients inside it.
  const blockGroups = useMemo(() => {
    const map = new Map<string, { block: Block; routes: RouteMetric[] }>();
    for (const rm of routeMetrics) {
      for (const b of rm.blocks) {
        const entry = map.get(b.id) ?? { block: b, routes: [] };
        entry.routes.push(rm);
        map.set(b.id, entry);
      }
    }
    return [...map.values()].map(({ block, routes }) => {
      const clientsIn = clientMetrics.filter((cm) =>
        pointInPolygon([cm.client.lat, cm.client.lng], block.polygon),
      );
      const clientCount = clientsIn.length;
      const avgTicket = clientCount
        ? Math.round(clientsIn.reduce((a, cm) => a + cm.client.ticketPromedio, 0) / clientCount)
        : 0;
      const totalDrop = clientsIn.reduce((a, cm) => a + cm.client.dropSize, 0);
      return { block, routes, clientCount, avgTicket, totalDrop };
    });
  }, [routeMetrics, clientMetrics]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    blockGroups.forEach(({ block }) => block.polygon.forEach((p) => pts.push(p)));
    return pts;
  }, [blockGroups]);

  const hasRoutes = blockGroups.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl fullscreenTargetRef={fullscreenTargetRef}>
        {blockGroups.map(({ block, routes, clientCount, avgTicket, totalDrop }) => {
          const shared = routes.length > 1;
          const color = shared ? SHARED_COLOR : routes[0].route.color;
          return (
            <Polygon
              key={block.id}
              positions={block.polygon}
              pathOptions={{
                color,
                weight: shared ? 3 : 2,
                fillColor: color,
                fillOpacity: shared ? 0.3 : 0.26,
                dashArray: shared ? "6 4" : undefined,
              }}
            >
              <LeafletTooltip sticky>
                <div className="space-y-1">
                  <div className="font-semibold">
                    Manzano
                    {shared && <span className="text-amber-600 dark:text-amber-400"> · compartido</span>}
                  </div>
                  <div className={cn("font-medium", shared && "text-amber-600 dark:text-amber-400")}>
                    {routes.length} {routes.length === 1 ? "ruta" : "rutas"} · {clientCount} clientes
                  </div>
                  <div>Ticket prom. {bs(avgTicket)}/mes</div>
                  <div>DropSize total {bs(totalDrop)}</div>
                  <div className="space-y-0.5 border-t pt-1">
                    {routes.map((rm) => (
                      <div key={rm.route.id} className="flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: rm.route.color }}
                        />
                        {rm.route.name}
                      </div>
                    ))}
                  </div>
                </div>
              </LeafletTooltip>
            </Polygon>
          );
        })}

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

        {sellerMarkers.map(({ rm, center }) => (
          <Marker key={`seller-${rm.route.id}`} position={center} icon={sellerPinIcon(rm.route.color, rm.sellers.length)}>
            <Popup>
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: rm.route.color }}>
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: rm.route.color }} />
                  {rm.route.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rm.sellers.length} {rm.sellers.length === 1 ? "vendedor" : "vendedores"} · {rm.clientCount} clientes
                </p>
                <ul className="space-y-1 border-t pt-1.5 text-xs">
                  {rm.sellers.map((s) => (
                    <li key={s.code} className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                        {sellerInitials(s.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}

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
