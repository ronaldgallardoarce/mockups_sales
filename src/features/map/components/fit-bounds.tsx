import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/types";

/** Fits the map to the given points whenever they change. */
export function FitBounds({ points, padding = 40 }: { points: LatLng[]; padding?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(([la, ln]) => [la, ln] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 16 });
    }
  }, [map, points, padding]);
  return null;
}
