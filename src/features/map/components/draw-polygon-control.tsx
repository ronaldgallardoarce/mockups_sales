import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type { LatLng } from "@/types";

const NEUTRAL = "#264bc5";
const round = (n: number) => Math.round(n * 1e6) / 1e6;

function coordsFromLayer(layer: L.Polygon): LatLng[] {
  const latlngs = layer.getLatLngs() as L.LatLng[][] | L.LatLng[];
  const ring = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs) as L.LatLng[];
  return ring.map((p) => [round(p.lat), round(p.lng)] as LatLng);
}

/**
 * On-demand polygon drawing (no toolbar). When `active`, the user can draw one
 * polygon; on finish it's handed to `onCreated` and drawing stops. The drawn
 * layer is removed (the parent persists it and re-renders from state).
 */
export function DrawPolygonControl({
  active,
  onCreated,
}: {
  active: boolean;
  onCreated: (polygon: LatLng[]) => void;
}) {
  const map = useMap();
  const cb = useRef(onCreated);
  cb.current = onCreated;

  useEffect(() => {
    const handleCreate = (e: { layer: L.Layer }) => {
      const layer = e.layer as L.Polygon;
      const coords = coordsFromLayer(layer);
      map.removeLayer(layer);
      cb.current(coords);
    };
    map.on("pm:create", handleCreate);
    return () => {
      map.off("pm:create", handleCreate);
    };
  }, [map]);

  useEffect(() => {
    if (active) {
      map.pm.setGlobalOptions({
        allowSelfIntersection: false,
        templineStyle: { color: NEUTRAL },
        hintlineStyle: { color: NEUTRAL, dashArray: "5 5" },
        pathOptions: { color: NEUTRAL, fillColor: NEUTRAL, fillOpacity: 0.18 },
      });
      map.pm.enableDraw("Polygon");
    } else {
      map.pm.disableDraw();
    }
    return () => {
      map.pm.disableDraw();
    };
  }, [map, active]);

  return null;
}
