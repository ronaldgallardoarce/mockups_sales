import type { LatLng, SellerDetail, SellerDetailRoute } from "@/types";

/**
 * Parse a block's `coordinates` string into a polygon. The backend serializes
 * it with single quotes (`[{'latitude':-20,'longitude':-50}]`), which is not
 * valid JSON, so quotes are normalized before parsing. Returns [] on any issue.
 */
export function parseBlockCoordinates(coordinates: string): LatLng[] {
  try {
    const normalized = coordinates.replace(/'/g, '"');
    const points = JSON.parse(normalized) as { latitude: number; longitude: number }[];
    return points
      .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
      .map((p) => [p.latitude, p.longitude] as LatLng);
  } catch {
    return [];
  }
}

/** A route ready to render on the map: parsed polygons + customer points. */
export interface ParsedSellerRoute {
  id: number;
  name: string;
  color: string;
  polygons: LatLng[][];
  customers: { id: number; name: string; subchannel: string; lat: number; lng: number }[];
}

export function parseSellerRoute(route: SellerDetailRoute): ParsedSellerRoute {
  const polygons: LatLng[][] = [];
  const customers: ParsedSellerRoute["customers"] = [];
  for (const block of route.blocks) {
    const poly = parseBlockCoordinates(block.coordinates);
    if (poly.length >= 3) polygons.push(poly);
    for (const c of block.customers) {
      customers.push({
        id: c.customerId,
        name: c.customerName,
        subchannel: c.subchannelName,
        lat: c.latitude,
        lng: c.longitud,
      });
    }
  }
  return { id: route.id, name: route.name, color: route.color, polygons, customers };
}

/** Every lat/lng across the given routes — used to fit the map bounds. */
export function collectPoints(routes: ParsedSellerRoute[]): LatLng[] {
  const pts: LatLng[] = [];
  for (const r of routes) {
    r.polygons.forEach((poly) => poly.forEach((p) => pts.push(p)));
    r.customers.forEach((c) => pts.push([c.lat, c.lng]));
  }
  return pts;
}
