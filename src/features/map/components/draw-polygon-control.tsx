import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

export interface DrawHandle {
  /** Read the (possibly edited) draft coords and clear it. Null if no draft. */
  save: () => LatLng[] | null;
  /** Discard the current draft. */
  cancel: () => void;
}

interface DrawPolygonControlProps {
  /** True while polygon drawing is enabled. */
  active: boolean;
  /** Fired when a polygon draft has been drawn (awaiting save confirmation). */
  onDraftCreated: () => void;
}

/**
 * On-demand polygon drawing. When finished, the polygon stays as an EDITABLE
 * draft (dashed) — it is NOT persisted until the parent calls `save()`. The
 * user can drag its vertices before confirming. `cancel()` discards it.
 */
export const DrawPolygonControl = forwardRef<DrawHandle, DrawPolygonControlProps>(
  function DrawPolygonControl({ active, onDraftCreated }, ref) {
    const map = useMap();
    const draftRef = useRef<L.Polygon | null>(null);
    const cb = useRef(onDraftCreated);
    cb.current = onDraftCreated;

    const clearDraft = () => {
      const layer = draftRef.current;
      if (layer) {
        layer.pm?.disable?.();
        map.removeLayer(layer);
        draftRef.current = null;
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        save: () => {
          const layer = draftRef.current;
          if (!layer) return null;
          const coords = coordsFromLayer(layer);
          clearDraft();
          return coords;
        },
        cancel: clearDraft,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [map],
    );

    // Keep the finished polygon as an editable draft (do not persist yet).
    useEffect(() => {
      const handleCreate = (e: { layer: L.Layer }) => {
        const layer = e.layer as L.Polygon;
        draftRef.current = layer;
        layer.setStyle({ color: NEUTRAL, fillColor: NEUTRAL, fillOpacity: 0.2, dashArray: "6 4" });
        layer.pm?.enable?.({ allowSelfIntersection: false });
        cb.current();
      };
      map.on("pm:create", handleCreate);
      return () => {
        map.off("pm:create", handleCreate);
      };
    }, [map]);

    // Enable / disable the polygon draw tool.
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

    // Clean up any pending draft on unmount.
    useEffect(
      () => () => clearDraft(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [map],
    );

    return null;
  },
);
