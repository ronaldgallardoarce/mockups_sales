import type { ReactNode } from "react";
import { Polygon, Tooltip } from "react-leaflet";
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
  /** Optional hover tooltip content per block (caller supplies domain data). */
  renderTooltip?: (block: Block) => ReactNode;
  /** Blocks to outline as a "ghost" (e.g. a market's manzanos not in the route). */
  ghostIds?: string[];
  ghostColor?: string;
}

export function BlockPolygons({
  blocks,
  color = NEUTRAL,
  onSelect,
  selectedId,
  selectedIds,
  warnIds = [],
  blockColors,
  renderTooltip,
  ghostIds,
  ghostColor,
}: BlockPolygonsProps) {
  return (
    <>
      {blocks.map((block) => {
        const selected = block.id === selectedId || !!selectedIds?.includes(block.id);
        const warn = warnIds.includes(block.id);
        // Ghost = part of the previewed set but not selected — shown dashed/faint.
        const ghost = !selected && !!ghostIds?.includes(block.id);
        const override = blockColors?.[block.id];
        const paint = warn
          ? "#ef4444"
          : selected
            ? (override ?? SELECTED)
            : ghost
              ? (ghostColor ?? color)
              : color;
        return (
          <Polygon
            key={block.id}
            positions={block.polygon}
            eventHandlers={onSelect ? { click: () => onSelect(block) } : undefined}
            pathOptions={{
              color: paint,
              weight: selected ? 3 : warn ? 2.5 : ghost ? 2 : 1.5,
              fillColor: paint,
              fillOpacity: selected ? 0.4 : ghost ? 0.12 : 0.18,
              dashArray: warn ? "6 4" : ghost ? "4 4" : undefined,
            }}
          >
            {renderTooltip && <Tooltip sticky>{renderTooltip(block)}</Tooltip>}
          </Polygon>
        );
      })}
    </>
  );
}
