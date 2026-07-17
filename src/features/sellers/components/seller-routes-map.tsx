import { Fragment, useMemo } from "react";
import { CircleMarker, Polygon, Tooltip } from "react-leaflet";
import { MapPin } from "lucide-react";
import type { SellerDetailRoute } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { ColorDot } from "@/components/common/channel-badge";
import { collectPoints, parseSellerRoute } from "../lib/seller-detail";

interface SellerRoutesMapProps {
  /** Assigned routes to plot; each route's manzanos + customers use its color. */
  routes: SellerDetailRoute[];
}

/** Read-only map of a seller's assigned routes: manzanos + customers, per color. */
export function SellerRoutesMap({ routes }: SellerRoutesMapProps) {
  const parsed = useMemo(() => routes.map(parseSellerRoute), [routes]);
  const fitPoints = useMemo(() => collectPoints(parsed), [parsed]);
  const hasGeometry = fitPoints.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        {parsed.map((route) => (
          <Fragment key={route.id}>
            {route.polygons.map((poly, i) => (
              <Polygon
                key={`${route.id}-poly-${i}`}
                positions={poly}
                pathOptions={{
                  color: route.color,
                  weight: 2,
                  fillColor: route.color,
                  fillOpacity: 0.18,
                }}
              />
            ))}
            {route.customers.map((c) => (
              <CircleMarker
                key={`${route.id}-cust-${c.id}`}
                center={[c.lat, c.lng]}
                radius={5}
                pathOptions={{ color: "#fff", weight: 1.5, fillColor: route.color, fillOpacity: 1 }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div style={{ color: route.color }}>{c.subchannel}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </Fragment>
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

      {!hasGeometry && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Este vendedor no tiene rutas con manzanos para mostrar.
          </p>
        </div>
      )}
    </div>
  );
}
