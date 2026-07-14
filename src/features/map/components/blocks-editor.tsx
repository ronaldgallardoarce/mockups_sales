import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type { Block, LatLng } from "@/types";
import { centroid } from "@/lib/geo";

interface BlocksEditorProps {
  blocks: Block[];
  counts: Map<string, number>;
  selectedId: string | null;
  editShapeId: string | null;
  warnIds: string[];
  onCreate: (polygon: LatLng[]) => void;
  onUpdateGeometry: (id: string, polygon: LatLng[]) => void;
  onSelect: (id: string) => void;
}

const NEUTRAL = "#264bc5";
/** Distinct highlight color for the currently selected manzano. */
const SELECTED = "#f59e0b";
const round = (n: number) => Math.round(n * 1e6) / 1e6;

function coordsFromLayer(layer: L.Polygon): LatLng[] {
  const latlngs = layer.getLatLngs() as L.LatLng[][] | L.LatLng[];
  const ring = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs) as L.LatLng[];
  return ring.map((p) => [round(p.lat), round(p.lng)] as LatLng);
}

const serialize = (poly: LatLng[]) => poly.map(([a, b]) => `${round(a)},${round(b)}`).join("|");

function badgeHtml(count: number, selected: boolean, warn: boolean) {
  const bg = warn ? "#ef4444" : selected ? SELECTED : NEUTRAL;
  return `<div style="
      display:flex;align-items:center;justify-content:center;
      min-width:22px;height:22px;padding:0 6px;border-radius:9999px;
      background:${bg};color:#fff;font-size:11px;font-weight:700;line-height:1;
      border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);
    ">${count}</div>`;
}

function badgeMarker(pos: L.LatLngExpression, count: number, selected: boolean, warn: boolean) {
  return L.marker(pos, {
    interactive: false,
    keyboard: false,
    icon: L.divIcon({
      className: "block-count-badge",
      html: badgeHtml(count, selected, warn),
      iconSize: [22, 22],
    }),
  });
}

interface LayerEntry {
  poly: L.Polygon;
  /** Only present when the block currently contains at least one client. */
  badge: L.Marker | null;
}

/**
 * Imperatively manages block polygons + a client-count badge per block, plus
 * the Geoman *draw* toolbar. Editing a shape and deleting are driven from the
 * parent (via `editShapeId` and by mutating the store); this component only
 * reflects state and forwards create / geometry-update / select events.
 */
export function BlocksEditor(props: BlocksEditorProps) {
  const map = useMap();
  const entries = useRef(new Map<string, LayerEntry>());
  const cbs = useRef(props);
  cbs.current = props;

  // ---- Geoman draw toolbar + create listener (mount once) ----
  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawText: false,
      drawRectangle: false,
      drawPolygon: true,
      cutPolygon: false,
      rotateMode: false,
      editMode: false,
      dragMode: false,
      removalMode: false,
    });
    map.pm.setLang("es");
    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      templineStyle: { color: NEUTRAL },
      hintlineStyle: { color: NEUTRAL, dashArray: "5 5" },
      pathOptions: { color: NEUTRAL, fillColor: NEUTRAL, fillOpacity: 0.18 },
    });

    const handleCreate = (e: { layer: L.Layer }) => {
      const layer = e.layer as L.Polygon;
      const coords = coordsFromLayer(layer);
      map.removeLayer(layer); // persisted via store, then re-rendered from state
      cbs.current.onCreate(coords);
    };
    map.on("pm:create", handleCreate);

    return () => {
      map.off("pm:create", handleCreate);
      try {
        map.pm.removeControls();
      } catch {
        /* map already torn down */
      }
      entries.current.forEach(({ poly, badge }) => {
        map.removeLayer(poly);
        if (badge) map.removeLayer(badge);
      });
      entries.current.clear();
    };
  }, [map]);

  // ---- Reconcile store blocks with map layers ----
  useEffect(() => {
    const { blocks, counts, selectedId, editShapeId, warnIds } = props;
    const seen = new Set<string>();

    for (const block of blocks) {
      seen.add(block.id);
      const positions = block.polygon.map(([la, ln]) => [la, ln]) as L.LatLngExpression[];
      const warn = warnIds.includes(block.id);
      const selected = block.id === selectedId;
      const count = counts.get(block.id) ?? 0;
      const style: L.PathOptions = {
        color: warn ? "#ef4444" : selected ? SELECTED : NEUTRAL,
        weight: selected ? 3 : warn ? 2.5 : 1.5,
        fillColor: warn ? "#ef4444" : selected ? SELECTED : NEUTRAL,
        fillOpacity: selected ? 0.35 : 0.18,
        dashArray: warn ? "6 4" : undefined,
      };
      const [clat, clng] = centroid(block.polygon);

      let entry = entries.current.get(block.id);
      if (!entry) {
        const poly = L.polygon(positions, style);
        poly.on("click", () => cbs.current.onSelect(block.id));
        poly.on("pm:update", () =>
          cbs.current.onUpdateGeometry(block.id, coordsFromLayer(poly)),
        );
        poly.addTo(map);
        entry = { poly, badge: null };
        entries.current.set(block.id, entry);
      } else if (serialize(coordsFromLayer(entry.poly)) !== serialize(block.polygon)) {
        entry.poly.setLatLngs(positions);
      }
      entry.poly.setStyle(style);

      // Badge: only when the block currently holds at least one client.
      if (count > 0) {
        if (entry.badge) {
          entry.badge.setLatLng([clat, clng]);
          entry.badge.setIcon(
            L.divIcon({
              className: "block-count-badge",
              html: badgeHtml(count, selected, warn),
              iconSize: [22, 22],
            }),
          );
        } else {
          entry.badge = badgeMarker([clat, clng], count, selected, warn).addTo(map);
        }
      } else if (entry.badge) {
        map.removeLayer(entry.badge);
        entry.badge = null;
      }

      // Per-block shape editing.
      const pm = entry.poly.pm;
      if (block.id === editShapeId) {
        if (pm && !pm.enabled()) pm.enable({ allowSelfIntersection: false });
      } else if (pm && pm.enabled()) {
        pm.disable();
      }
    }

    for (const [id, entry] of entries.current) {
      if (!seen.has(id)) {
        map.removeLayer(entry.poly);
        if (entry.badge) map.removeLayer(entry.badge);
        entries.current.delete(id);
      }
    }
  }, [map, props]);

  return null;
}
