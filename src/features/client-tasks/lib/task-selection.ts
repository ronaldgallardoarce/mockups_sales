import type { Block, Client } from "@/types";
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
