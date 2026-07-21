import type { Block, Client, Route, RouteFrequency, SellerRouteAssignment } from "@/types";
import { ALL_WEEKS } from "@/types";
import { getChannel } from "@/data/channels";
import { pointInPolygon } from "@/lib/geo";

/** A conflict of one route against another already assigned to the same seller. */
export interface RouteConflict {
  routeId: string;
  otherRouteId: string;
  otherRouteName: string;
  /** Channel on which the two routes duplicate each other. */
  channelId: string;
  channelName: string;
  /** How many of that channel's clients are served by both routes. */
  sharedClients: number;
  /** How many manzanos the two routes have in common. */
  sharedBlocks: number;
}

/**
 * Two frequencies clash when their validity windows overlap, they share a
 * weekday, and their week-of-month scope overlaps. Weekly/biweekly cadences are
 * treated as covering every week; only MENSUAL narrows to specific weeks.
 */
export function frequenciesOverlap(a: RouteFrequency, b: RouteFrequency): boolean {
  if (a.validFrom > b.validTo || b.validFrom > a.validTo) return false;
  if (!a.days.some((d) => b.days.includes(d))) return false;
  const aWeeks = a.type === "MENSUAL" ? a.weeks : ALL_WEEKS;
  const bWeeks = b.type === "MENSUAL" ? b.weeks : ALL_WEEKS;
  return aWeeks.some((w) => bWeeks.includes(w));
}

/**
 * Clients a route serves for this seller, grouped by channel. Excluded clients
 * drop out. A client is served when it sits inside a route manzano and its
 * subcanal belongs to the route.
 */
function coverageByChannel(
  route: Route,
  clients: Client[],
  blocks: Block[],
  excludedClientIds: Set<string>,
): Map<string, Set<string>> {
  const routeBlocks = blocks.filter((b) => route.blockIds.includes(b.id));
  const byChannel = new Map<string, Set<string>>();
  for (const c of clients) {
    if (excludedClientIds.has(c.id)) continue;
    if (!route.subcanalIds.includes(c.subcanalId)) continue;
    if (!routeBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))) continue;
    const set = byChannel.get(c.channelId) ?? new Set<string>();
    set.add(c.id);
    byChannel.set(c.channelId, set);
  }
  return byChannel;
}

/** True when every id of `small` is also in `big` (i.e. small ⊆ big). */
function isSubset(small: Set<string>, big: Set<string>): boolean {
  for (const id of small) if (!big.has(id)) return false;
  return true;
}

/**
 * Detect routes assigned to the same seller that duplicate each other. Sharing
 * *some* manzanos is allowed; the conflict is when — on a channel they have in
 * common — one route's client set is fully contained in the other's (identical
 * or redundant coverage) with an overlapping frequency. A different channel
 * never conflicts. Returns one entry per route per conflict (both directions).
 */
export function detectRouteConflicts(
  assignments: SellerRouteAssignment[],
  findRoute: (id: string) => Route | undefined,
  clients: Client[],
  blocks: Block[],
  excludedClientIds: Set<string>,
): RouteConflict[] {
  const items = assignments
    .map((a) => {
      const route = findRoute(a.routeId);
      return route
        ? { route, frequency: a.frequency, coverage: coverageByChannel(route, clients, blocks, excludedClientIds) }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const conflicts: RouteConflict[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i];
      const B = items[j];
      if (!frequenciesOverlap(A.frequency, B.frequency)) continue;

      const sharedChannels = A.route.channelIds.filter((c) => B.route.channelIds.includes(c));
      // A channel where one route fully duplicates the other's clients.
      const dupChannel = sharedChannels.find((channelId) => {
        const ca = A.coverage.get(channelId);
        const cb = B.coverage.get(channelId);
        if (!ca || !cb || ca.size === 0 || cb.size === 0) return false;
        return isSubset(ca, cb) || isSubset(cb, ca);
      });
      if (!dupChannel) continue;

      const ca = A.coverage.get(dupChannel)!;
      const cb = B.coverage.get(dupChannel)!;
      const sharedClients = Math.min(ca.size, cb.size);
      const sharedBlocks = A.route.blockIds.filter((b) => B.route.blockIds.includes(b)).length;
      const channelName = getChannel(dupChannel)?.name ?? dupChannel;
      const base = { channelId: dupChannel, channelName, sharedClients, sharedBlocks };
      conflicts.push({ routeId: A.route.id, otherRouteId: B.route.id, otherRouteName: B.route.name, ...base });
      conflicts.push({ routeId: B.route.id, otherRouteId: A.route.id, otherRouteName: A.route.name, ...base });
    }
  }
  return conflicts;
}
