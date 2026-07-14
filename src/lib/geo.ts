import type { LatLng, Polygon } from "@/types";

/** Trinidad, Beni, Bolivia — default map center. */
export const TRINIDAD_CENTER: LatLng = [-14.834, -64.901];
export const DEFAULT_ZOOM = 14;

/** Ray-casting point-in-polygon test. */
export function pointInPolygon(point: LatLng, polygon: Polygon): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Count how many of the given points fall inside the polygon. */
export function countPointsInPolygon(points: LatLng[], polygon: Polygon): number {
  let n = 0;
  for (const p of points) if (pointInPolygon(p, polygon)) n++;
  return n;
}

function centroid(polygon: Polygon): LatLng {
  const n = polygon.length;
  const sum = polygon.reduce<[number, number]>(
    (acc, [la, ln]) => [acc[0] + la, acc[1] + ln],
    [0, 0],
  );
  return [sum[0] / n, sum[1] / n];
}

/** Axis-aligned bounding box of a polygon. */
function bbox(polygon: Polygon) {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  for (const [la, ln] of polygon) {
    minLat = Math.min(minLat, la);
    maxLat = Math.max(maxLat, la);
    minLng = Math.min(minLng, ln);
    maxLng = Math.max(maxLng, ln);
  }
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Lightweight overlap heuristic used to warn the user when a freshly drawn
 * block collides with an existing one: true if bounding boxes intersect AND
 * either centroid falls inside the other polygon.
 */
export function polygonsOverlap(a: Polygon, b: Polygon): boolean {
  const ba = bbox(a);
  const bb = bbox(b);
  const bboxIntersect =
    ba.minLat <= bb.maxLat &&
    ba.maxLat >= bb.minLat &&
    ba.minLng <= bb.maxLng &&
    ba.maxLng >= bb.minLng;
  if (!bboxIntersect) return false;
  return (
    pointInPolygon(centroid(a), b) ||
    pointInPolygon(centroid(b), a) ||
    a.some((p) => pointInPolygon(p, b)) ||
    b.some((p) => pointInPolygon(p, a))
  );
}

export { centroid };
