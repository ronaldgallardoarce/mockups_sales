import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type { Block, LatLng } from "@/types";
import { bbox, centroid } from "@/lib/geo";
import { buildVertexMesh } from "@/lib/vertex-mesh";

interface BlocksEditorProps {
  blocks: Block[];
  counts: Map<string, number>;
  /** When false, the per-block client-count badges are hidden (only polygons). */
  showCounts: boolean;
  selectedId: string | null;
  editShapeId: string | null;
  warnIds: string[];
  /** Whether the "guided cut" tool is active for the selected block. */
  cutMode: boolean;
  /** Orientation of the guide line while cut mode is active. */
  cutAxis: "lat" | "lng";
  /**
   * When true, dragging a vertex shared with another block (a coincident
   * boundary point) moves every block that shares it, keeping the shared
   * edge intact. When false, only the block being edited moves (native
   * per-block Geoman behavior).
   */
  linkVertices: boolean;
  /**
   * When true, a drawn polygon is persisted immediately (no confirm dialog) and
   * the polygon draw tool is re-armed so the user can chain manzano after
   * manzano without re-clicking the toolbar button.
   */
  autoSave: boolean;
  onCreate: (polygon: LatLng[]) => void;
  onUpdateGeometry: (id: string, polygon: LatLng[]) => void;
  onSelect: (id: string) => void;
  /** Fired when the user clicks the map while the cut guide is showing. */
  onCutConfirm: (axis: "lat" | "lng", value: number) => void;
  /** Fired on Escape while cut mode is active. */
  onCutCancel: () => void;
}

const NEUTRAL = "#264bc5";
/** Distinct highlight color for the currently selected manzano. */
const SELECTED = "#f59e0b";
const round = (n: number) => Math.round(n * 1e6) / 1e6;

function getRing(layer: L.Polygon): L.LatLng[] {
  const latlngs = layer.getLatLngs() as L.LatLng[][] | L.LatLng[];
  return (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs) as L.LatLng[];
}

function coordsFromLayer(layer: L.Polygon): LatLng[] {
  return getRing(layer).map((p) => [round(p.lat), round(p.lng)] as LatLng);
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
  /**
   * While a vertex shared with other blocks is being dragged (`linkVertices`
   * on), the sibling `{blockId, vertexIndex}` list to also move live — stashed
   * on `pm:markerdragstart`, read on every `pm:markerdrag`, committed and
   * cleared on `pm:markerdragend`. `null`/empty means "not a linked drag".
   */
  const dragSiblings = useRef<{ blockId: string; vertexIndex: number }[] | null>(null);

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
      // Auto-save mode: re-arm the polygon tool so drawing keeps going. Deferred
      // to the next tick so Geoman finishes tearing down the current draw session
      // before a new one starts.
      if (cbs.current.autoSave) {
        setTimeout(() => {
          if (cbs.current.autoSave) map.pm.enableDraw("Polygon");
        }, 0);
      }
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
    const { blocks, counts, showCounts, selectedId, editShapeId, warnIds } = props;
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

        // Only the block matching `editShapeId` ever has `pm.enable()` active
        // at a time, so these three fire exclusively for the one layer being
        // edited — no need to guard against concurrent edits across layers.
        poly.on("pm:markerdragstart", (e) => {
          dragSiblings.current = null;
          if (!cbs.current.linkVertices) return;
          const indexPath = e.indexPath as unknown as number[];
          const vertexIndex = indexPath[indexPath.length - 1];
          const currentBlock = cbs.current.blocks.find((b) => b.id === block.id);
          const vertex = currentBlock?.polygon[vertexIndex];
          if (!vertex) return;
          const mesh = buildVertexMesh(cbs.current.blocks);
          const siblings = mesh.get(`${vertex[0]},${vertex[1]}`);
          if (!siblings) return;
          const others = siblings.filter(
            (s) => !(s.blockId === block.id && s.vertexIndex === vertexIndex),
          );
          if (others.length > 0) dragSiblings.current = others;
        });

        poly.on("pm:markerdrag", (e) => {
          const siblings = dragSiblings.current;
          if (!siblings || siblings.length === 0) return;
          const latlng = (e.markerEvent as { target: L.Marker }).target.getLatLng();
          for (const sib of siblings) {
            const sibEntry = entries.current.get(sib.blockId);
            if (!sibEntry) continue;
            const ring = getRing(sibEntry.poly).slice();
            ring[sib.vertexIndex] = latlng;
            sibEntry.poly.setLatLngs(ring);
          }
        });

        poly.on("pm:markerdragend", () => {
          const siblings = dragSiblings.current;
          dragSiblings.current = null;
          // Always commit the dragged block's own geometry immediately, not just
          // when it has linked siblings. Otherwise (independent-vertex mode, or a
          // vertex with no shared neighbor) nothing persists until the edit
          // session ends via "Listo" — and by then the reconcile effect below
          // has already overwritten the live layer with the *stale* store value
          // (since the store hadn't been updated yet), reverting the drag.
          cbs.current.onUpdateGeometry(block.id, coordsFromLayer(poly));
          if (!siblings || siblings.length === 0) return;
          for (const sib of siblings) {
            const sibEntry = entries.current.get(sib.blockId);
            if (sibEntry) {
              cbs.current.onUpdateGeometry(sib.blockId, coordsFromLayer(sibEntry.poly));
            }
          }
        });

        poly.addTo(map);
        entry = { poly, badge: null };
        entries.current.set(block.id, entry);
      } else if (serialize(coordsFromLayer(entry.poly)) !== serialize(block.polygon)) {
        entry.poly.setLatLngs(positions);
      }
      entry.poly.setStyle(style);

      // Badge: only when counts are enabled and the block holds ≥1 client.
      if (showCounts && count > 0) {
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

  // ---- Guided cut tool: live guide line + click-to-confirm + Escape-to-cancel ----
  const guideLine = useRef<L.Polyline | null>(null);
  useEffect(() => {
    if (!props.cutMode) return;
    const block = cbs.current.blocks.find((b) => b.id === cbs.current.selectedId);
    if (!block) return;

    const { minLat, maxLat, minLng, maxLng } = bbox(block.polygon);
    const padLat = (maxLat - minLat) * 0.15 || 0.0005;
    const padLng = (maxLng - minLng) * 0.15 || 0.0005;

    const drawGuide = (latlng: L.LatLng) => {
      const axis = cbs.current.cutAxis;
      const positions: L.LatLngExpression[] =
        axis === "lat"
          ? [
              [latlng.lat, minLng - padLng],
              [latlng.lat, maxLng + padLng],
            ]
          : [
              [minLat - padLat, latlng.lng],
              [maxLat + padLat, latlng.lng],
            ];
      if (guideLine.current) {
        guideLine.current.setLatLngs(positions);
      } else {
        guideLine.current = L.polyline(positions, {
          color: SELECTED,
          weight: 2,
          dashArray: "6 6",
          interactive: false,
        }).addTo(map);
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => drawGuide(e.latlng);
    const handleClick = (e: L.LeafletMouseEvent) => {
      const axis = cbs.current.cutAxis;
      const value = axis === "lat" ? e.latlng.lat : e.latlng.lng;
      cbs.current.onCutConfirm(axis, value);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cbs.current.onCutCancel();
    };

    map.on("mousemove", handleMouseMove);
    map.on("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    const container = map.getContainer();
    const prevCursor = container.style.cursor;
    container.style.cursor = "crosshair";

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      container.style.cursor = prevCursor;
      if (guideLine.current) {
        map.removeLayer(guideLine.current);
        guideLine.current = null;
      }
    };
  }, [map, props.cutMode, props.cutAxis, props.selectedId]);

  return null;
}
