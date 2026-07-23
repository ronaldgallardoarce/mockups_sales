import { useEffect, useMemo } from "react";
import { Marker, Polygon, Popup, Tooltip as LeafletTooltip } from "react-leaflet";
import { MapPinned } from "lucide-react";
import type { Block, Client, LatLng, Route } from "@/types";
import { BaseMap } from "@/features/map/components/base-map";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { channelColor, getChannel, getSubcanal } from "@/data/channels";
import { clientPinIcon } from "@/features/map/lib/leaflet-setup";
import { countClientsInBlock, resolveSelectionClientIds } from "../lib/task-selection";

/** Amber, used to flag a manzano shared by more than one route. */
const SHARED_COLOR = "#f59e0b";
/** Slate, for a standalone manzano not belonging to any visible route. */
const STANDALONE_COLOR = "#64748b";
/** Violet emphasis for an individually selected manzano (route-independent). */
const SELECTED_BLOCK_COLOR = "#7c3aed";

interface ClientTaskMapProps {
  /** Routes eligible for the current view (already filtered by city/channel). */
  routes: Route[];
  /** Every block — resolves route/block ids to polygons. */
  blocks: Block[];
  clients: Client[];
  selectedRouteIds: Set<string>;
  selectedBlockIds: Set<string>;
  /** Toggle an individual manzano in/out of the block selection. */
  onToggleBlock: (blockId: string) => void;
  /** Reports the client ids resolved from the current route + block selection. */
  onResolvedClientsChange?: (clientIds: string[]) => void;
  fullscreenTargetRef?: React.RefObject<HTMLElement>;
}

/**
 * Map for building a client-task target set: shows the route manzanos, lets the
 * user click individual manzanos to add them, and highlights every client the
 * current selection resolves to. Selection state is owned by the parent.
 */
export function ClientTaskMap({
  routes,
  blocks,
  clients,
  selectedRouteIds,
  selectedBlockIds,
  onToggleBlock,
  onResolvedClientsChange,
  fullscreenTargetRef,
}: ClientTaskMapProps) {
  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const hasRouteSelection = selectedRouteIds.size > 0;

  // When routes are selected we show only those; otherwise every filtered route.
  const visibleRoutes = useMemo(
    () => (hasRouteSelection ? routes.filter((r) => selectedRouteIds.has(r.id)) : routes),
    [routes, selectedRouteIds, hasRouteSelection],
  );

  // Group by manzano: a block can belong to several visible routes, so it is
  // drawn once. Individually selected blocks are included even when their route
  // is not among the visible ones.
  const blockGroups = useMemo(() => {
    const map = new Map<string, { block: Block; routes: Route[] }>();
    for (const r of visibleRoutes) {
      for (const id of r.blockIds) {
        const b = blockById.get(id);
        if (!b) continue;
        const entry = map.get(b.id) ?? { block: b, routes: [] };
        entry.routes.push(r);
        map.set(b.id, entry);
      }
    }
    for (const id of selectedBlockIds) {
      const b = blockById.get(id);
      if (b && !map.has(b.id)) map.set(b.id, { block: b, routes: [] });
    }
    return [...map.values()].map(({ block, routes }) => ({
      block,
      routes,
      clientCount: countClientsInBlock(clients, block),
    }));
  }, [visibleRoutes, blockById, selectedBlockIds, clients]);

  const resolvedIds = useMemo(
    () => resolveSelectionClientIds({ routes, allBlocks: blocks, clients, selectedRouteIds, selectedBlockIds }),
    [routes, blocks, clients, selectedRouteIds, selectedBlockIds],
  );
  const resolvedKey = resolvedIds.join(",");

  // Report the resolved client ids up to the parent whenever they change.
  useEffect(() => {
    onResolvedClientsChange?.(resolvedIds);
    // resolvedKey captures the meaningful change; avoids firing on identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedKey]);

  const resolvedClients = useMemo(() => {
    const set = new Set(resolvedIds);
    return clients.filter((c) => set.has(c.id));
  }, [resolvedIds, clients]);

  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    blockGroups.forEach(({ block }) => block.polygon.forEach((p) => pts.push(p)));
    return pts;
  }, [blockGroups]);

  const hasBlocks = blockGroups.length > 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl fullscreenTargetRef={fullscreenTargetRef}>
        {blockGroups.map(({ block, routes: blockRoutes, clientCount }) => {
          const isSelected = selectedBlockIds.has(block.id);
          const shared = blockRoutes.length > 1;
          const baseColor = blockRoutes.length
            ? shared
              ? SHARED_COLOR
              : blockRoutes[0].color
            : STANDALONE_COLOR;
          const color = isSelected ? SELECTED_BLOCK_COLOR : baseColor;
          return (
            <Polygon
              key={block.id}
              positions={block.polygon}
              pathOptions={{
                color,
                weight: isSelected ? 4 : hasRouteSelection ? 3 : 2,
                fillColor: color,
                fillOpacity: isSelected ? 0.4 : hasRouteSelection ? 0.32 : 0.18,
                dashArray: isSelected ? "6 4" : undefined,
              }}
              eventHandlers={{ click: () => onToggleBlock(block.id) }}
            >
              <LeafletTooltip sticky>
                <div className="space-y-1">
                  <div className="font-semibold">
                    Manzano
                    {isSelected && <span className="text-violet-600 dark:text-violet-400"> · seleccionado</span>}
                    {shared && <span className="text-amber-600 dark:text-amber-400"> · compartido</span>}
                  </div>
                  <div className="font-medium">{clientCount} clientes</div>
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
                    Clic para {isSelected ? "quitar" : "agregar"} el manzano
                  </div>
                </div>
              </LeafletTooltip>
            </Polygon>
          );
        })}

        {resolvedClients.map((client) => {
          const color = channelColor(client.channelId);
          return (
            <Marker key={client.id} position={[client.lat, client.lng]} icon={clientPinIcon(color)}>
              <Popup>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.code} · {client.ownerName}
                  </p>
                  <p className="text-xs font-medium" style={{ color }}>
                    {getChannel(client.channelId)?.name} · {getSubcanal(client.subcanalId)?.name}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds points={fitPoints} />
      </BaseMap>

      {!hasBlocks && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 text-center backdrop-blur-sm">
          <MapPinned className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Selecciona rutas o manzanos para elegir clientes.
          </p>
        </div>
      )}
    </div>
  );
}
