import { Polygon } from "react-leaflet";
import type { Block } from "@/types";

const NEUTRAL = "#264bc5";
const SELECTED = "#f59e0b";

interface BlockPolygonsProps {
  blocks: Block[];
  /** Outline / fill color (blocks are channel-agnostic; caller decides). */
  color?: string;
  onSelect?: (block: Block) => void;
  selectedId?: string | null;
  /** Multi-select support (route composition). */
  selectedIds?: string[];
  /** Ids to render with a warning (overlap) style. */
  warnIds?: string[];
  /** Per-block override color (e.g. blocks that belong to an assigned market). */
  blockColors?: Record<string, string>;
}

export function BlockPolygons({
  blocks,
  color = NEUTRAL,
  onSelect,
  selectedId,
  selectedIds,
  warnIds = [],
  blockColors,
}: BlockPolygonsProps) {
  return (
    <>
      {blocks.map((block) => {
        const selected = block.id === selectedId || !!selectedIds?.includes(block.id);
        const warn = warnIds.includes(block.id);
        const override = blockColors?.[block.id];
        const paint = warn ? "#ef4444" : selected ? (override ?? SELECTED) : color;
        return (
          <Polygon
            key={block.id}
            positions={block.polygon}
            eventHandlers={onSelect ? { click: () => onSelect(block) } : undefined}
            pathOptions={{
              color: paint,
              weight: selected ? 3 : warn ? 2.5 : 1.5,
              fillColor: paint,
              fillOpacity: selected ? 0.4 : 0.18,
              dashArray: warn ? "6 4" : undefined,
            }}
          />
        );
      })}
    </>
  );
}
