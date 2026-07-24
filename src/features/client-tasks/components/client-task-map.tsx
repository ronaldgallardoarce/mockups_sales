import { useEffect, useMemo } from "react";
import { Polygon, Tooltip as LeafletTooltip } from "react-leaflet";
import type { Block, Client, LatLng, Route } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { clientsInBlocks, countClientsInBlock } from "../lib/task-selection";

/** Amber, used to flag a manzano shared by more than one route. */
const SHARED_COLOR = "#f59e0b";
/** Slate, for a standalone manzano not belonging to any route. */
const STANDALONE_COLOR = "#64748b";
/** Violet emphasis for a manzano in the target set (selected). */
const SELECTED_BLOCK_COLOR = "#7c3aed";
/** Red, for a manzano explicitly carved out of a source's contribution. */
const EXCLUDED_COLOR = "#ef4444";

interface ClientTaskMapProps {
  /** Every route — used only to color/label manzanos, never to hide them. */
  routes: Route[];
  /** Every block — all manzanos are always drawn. */
  blocks: Block[];
  clients: Client[];
  /** Manzanos contributed by the selected routes/markets. */
  sourceBlockIds: Set<string>;
  /** Manzanos added by clicking directly on the map. */
  manualBlockIds: Set<string>;
  /** Manzanos explicitly excluded from a source's contribution. */
  excludedBlockIds: Set<string>;
  /** Click a manzano — the parent decides whether that adds, excludes or removes it. */
  onBlockClick: (blockId: string) => void;
  /** Reports the client ids resolved from the current target set. */
  onResolvedClientsChange?: (clientIds: string[]) => void;
  /** Points the camera should fit — owned by the parent so map clicks never refit. */
  fitPoints: LatLng[];
  fullscreenTargetRef?: React.RefObject<HTMLElement>;
}

/**
 * Map for building a client-task target set. Every manzano and every (already
 * channel-filtered) client is always visible; selecting routes/employees/markets
 * only highlights (adds) their manzanos, and the user can click any manzano to
 * add, exclude or remove it. Clients falling inside the target manzanos are
 * emphasized. Selection state is owned by the parent.
 */
export function ClientTaskMap({
  routes,
  blocks,
  clients,
  sourceBlockIds,
  manualBlockIds,
  excludedBlockIds,
  onBlockClick,
  onResolvedClientsChange,
  fitPoints,
  fullscreenTargetRef,
}: ClientTaskMapProps) {
  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  // Which routes each manzano belongs to (for color + tooltip), across ALL routes.
  const routesByBlock = useMemo(() => {
    const map = new Map<string, Route[]>();
    for (const r of routes) {
      for (const id of r.blockIds) {
        const arr = map.get(id) ?? [];
        arr.push(r);
        map.set(id, arr);
      }
    }
    return map;
  }, [routes]);

  // Effective target: (sources ∪ manual) − excluded.
  const targetBlockIds = useMemo(() => {
    const s = new Set(sourceBlockIds);
    manualBlockIds.forEach((id) => s.add(id));
    excludedBlockIds.forEach((id) => s.delete(id));
    return s;
  }, [sourceBlockIds, manualBlockIds, excludedBlockIds]);

  const resolvedIds = useMemo(() => {
    const target = [...targetBlockIds]
      .map((id) => blockById.get(id))
      .filter((b): b is Block => !!b);
    return [...new Set(clientsInBlocks(clients, target).map((c) => c.id))].sort();
  }, [targetBlockIds, blockById, clients]);
  const resolvedKey = resolvedIds.join(",");
  const resolvedSet = useMemo(() => new Set(resolvedIds), [resolvedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Report the resolved client ids up to the parent whenever they change.
  useEffect(() => {
    onResolvedClientsChange?.(resolvedIds);
    // resolvedKey captures the meaningful change; avoids firing on identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedKey]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl fullscreenTargetRef={fullscreenTargetRef}>
        {blocks.map((block) => {
          const blockRoutes = routesByBlock.get(block.id) ?? [];
          const inSource = sourceBlockIds.has(block.id);
          const inManual = manualBlockIds.has(block.id);
          // Exclusion only means something for a manzano a source contributed.
          const isExcluded = inSource && excludedBlockIds.has(block.id);
          const inTarget = targetBlockIds.has(block.id);
          const shared = blockRoutes.length > 1;

          const baseColor = blockRoutes.length
            ? shared
              ? SHARED_COLOR
              : blockRoutes[0].color
            : STANDALONE_COLOR;
          const color = isExcluded
            ? EXCLUDED_COLOR
            : inTarget
              ? SELECTED_BLOCK_COLOR
              : baseColor;

          const action = isExcluded
            ? "volver a incluir"
            : inSource
              ? "excluir"
              : inManual
                ? "quitar"
                : "agregar";

          return (
            <Polygon
              key={block.id}
              positions={block.polygon}
              pathOptions={{
                color,
                weight: inTarget ? 4 : isExcluded ? 3 : 2,
                fillColor: color,
                fillOpacity: inTarget ? 0.4 : isExcluded ? 0.28 : 0.12,
                dashArray: inTarget ? "6 4" : isExcluded ? "4 4" : undefined,
              }}
              eventHandlers={{ click: () => onBlockClick(block.id) }}
            >
              <LeafletTooltip sticky>
                <div className="space-y-1">
                  <div className="font-semibold">
                    Manzano
                    {inTarget && (
                      <span className="text-violet-600 dark:text-violet-400"> · seleccionado</span>
                    )}
                    {isExcluded && (
                      <span className="text-red-600 dark:text-red-400"> · excluido</span>
                    )}
                    {shared && !inTarget && !isExcluded && (
                      <span className="text-amber-600 dark:text-amber-400"> · compartido</span>
                    )}
                  </div>
                  <div className="font-medium">{countClientsInBlock(clients, block)} clientes</div>
                  {blockRoutes.length > 0 ? (
                    <div className="space-y-0.5 border-t pt-1">
                      {blockRoutes.map((r) => (
                        <div key={r.id} className="flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t pt-1 text-muted-foreground">Sin ruta</div>
                  )}
                  <div className="border-t pt-1 text-[11px] text-muted-foreground">
                    Clic para {action} el manzano
                  </div>
                </div>
              </LeafletTooltip>
            </Polygon>
          );
        })}

        <ClientMarkers clients={clients} highlightedClientIds={resolvedSet} />

        <FitBounds points={fitPoints} />
      </BaseMap>

      {targetBlockIds.size === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          Selecciona rutas, empleados, mercados o manzanos para elegir clientes.
        </div>
      )}
    </div>
  );
}
