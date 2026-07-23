import type { Block, Client, Route } from "@/types";
import { pointInPolygon } from "@/lib/geo";

/** Clients whose position falls inside any of the given manzanos (blocks). */
export function clientsInBlocks(clients: Client[], blocks: Block[]): Client[] {
  if (blocks.length === 0) return [];
  return clients.filter((c) => blocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
}

/** Number of clients whose position falls inside a single manzano (block). */
export function countClientsInBlock(clients: Client[], block: Block): number {
  let n = 0;
  for (const c of clients) if (pointInPolygon([c.lat, c.lng], block.polygon)) n++;
  return n;
}

interface ResolveArgs {
  /** Routes eligible for selection (already filtered by city/channel). */
  routes: Route[];
  /** Every block, used to resolve route/block ids to their polygons. */
  allBlocks: Block[];
  clients: Client[];
  selectedRouteIds: Set<string>;
  selectedBlockIds: Set<string>;
}

/**
 * Client ids targeted by the current selection: every client inside a selected
 * route's manzanos, plus every client inside an individually selected manzano.
 * Purely geographic (position-in-polygon) — no subcanal filtering — so the set
 * matches exactly what the map highlights. Returns a sorted, deduplicated list.
 */
export function resolveSelectionClientIds({
  routes,
  allBlocks,
  clients,
  selectedRouteIds,
  selectedBlockIds,
}: ResolveArgs): string[] {
  const blockById = new Map(allBlocks.map((b) => [b.id, b]));
  // Deduplicate blocks contributed by routes and by individual selection.
  const blocks = new Map<string, Block>();
  for (const r of routes) {
    if (!selectedRouteIds.has(r.id)) continue;
    for (const id of r.blockIds) {
      const b = blockById.get(id);
      if (b) blocks.set(b.id, b);
    }
  }
  for (const id of selectedBlockIds) {
    const b = blockById.get(id);
    if (b) blocks.set(b.id, b);
  }
  const ids = clientsInBlocks(clients, [...blocks.values()]).map((c) => c.id);
  return [...new Set(ids)].sort();
}
