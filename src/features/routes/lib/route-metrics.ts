import { useMemo } from "react";
import type { Block, Client, Route, Seller } from "@/types";
import { pointInPolygon } from "@/lib/geo";
import { useBlocksStore } from "@/stores/blocks-store";

export interface RouteMetric {
  route: Route;
  blocks: Block[];
  clientCount: number;
  /** Sellers assigned to this route. */
  sellerCount: number;
  /** Average monthly ticket (Bs) across the route's clients. */
  avgTicket: number;
  /** Sum of single-visit sales (Bs) across the route's clients. */
  totalDrop: number;
}

export interface ClientMetric {
  client: Client;
  /** Distinct sellers attending this client (via routes that cover it). */
  sellerCount: number;
}

export interface RoutesMetrics {
  routeMetrics: RouteMetric[];
  clientMetrics: ClientMetric[];
  summary: {
    routeCount: number;
    clientCount: number;
    /** Distinct sellers attending any of the routes. */
    sellerCount: number;
    avgTicket: number;
    totalDrop: number;
  };
}

/** A client belongs to a route when its subcanal matches and it sits inside the route's manzanos. */
function clientInRoute(client: Client, route: Route, blocks: Block[]) {
  return (
    route.subcanalIds.includes(client.subcanalId) &&
    blocks.some((b) => pointInPolygon([client.lat, client.lng], b.polygon))
  );
}

/** Computes route/client sales metrics and seller coverage for the map view. */
export function computeRoutesMetrics(
  routes: Route[],
  clients: Client[],
  sellers: Seller[],
  allBlocks: Block[],
): RoutesMetrics {
  // Sellers assigned to each route.
  const sellersByRoute = new Map<string, Set<number>>();
  for (const s of sellers) {
    for (const a of s.routeAssignments) {
      const set = sellersByRoute.get(a.routeId) ?? new Set<number>();
      set.add(s.code);
      sellersByRoute.set(a.routeId, set);
    }
  }

  const routeMetrics: RouteMetric[] = routes.map((route) => {
    const blocks = allBlocks.filter((b) => route.blockIds.includes(b.id));
    const inside = clients.filter((c) => clientInRoute(c, route, blocks));
    const avgTicket = inside.length
      ? Math.round(inside.reduce((a, c) => a + c.ticketPromedio, 0) / inside.length)
      : 0;
    const totalDrop = inside.reduce((a, c) => a + c.dropSize, 0);
    return {
      route,
      blocks,
      clientCount: inside.length,
      sellerCount: sellersByRoute.get(route.id)?.size ?? 0,
      avgTicket,
      totalDrop,
    };
  });

  // Per-client: which routes cover it, and how many distinct sellers attend it.
  const coverage = new Map<string, { client: Client; routeIds: Set<string> }>();
  for (const { route, blocks } of routeMetrics) {
    for (const c of clients) {
      if (!clientInRoute(c, route, blocks)) continue;
      const entry = coverage.get(c.id) ?? { client: c, routeIds: new Set<string>() };
      entry.routeIds.add(route.id);
      coverage.set(c.id, entry);
    }
  }

  const clientMetrics: ClientMetric[] = [...coverage.values()].map(({ client, routeIds }) => {
    const sellerSet = new Set<number>();
    for (const rid of routeIds) for (const code of sellersByRoute.get(rid) ?? []) sellerSet.add(code);
    return { client, sellerCount: sellerSet.size };
  });

  const allSellers = new Set<number>();
  for (const set of sellersByRoute.values()) for (const code of set) allSellers.add(code);
  const coveredClients = clientMetrics.map((cm) => cm.client);
  const avgTicket = coveredClients.length
    ? Math.round(coveredClients.reduce((a, c) => a + c.ticketPromedio, 0) / coveredClients.length)
    : 0;

  return {
    routeMetrics,
    clientMetrics,
    summary: {
      routeCount: routes.length,
      clientCount: coveredClients.length,
      sellerCount: allSellers.size,
      avgTicket,
      totalDrop: coveredClients.reduce((a, c) => a + c.dropSize, 0),
    },
  };
}

/** Format a number as Bolivian currency (Bs). */
export function bs(n: number) {
  return `Bs ${n.toLocaleString("es-BO")}`;
}

/** Clients matching a route-in-progress selection: subcanales, and optionally inside the chosen manzanos. */
export function useSelectionClients(clients: Client[], subcanalIds: string[], blockIds: string[]) {
  const blocks = useBlocksStore((s) => s.blocks);
  return useMemo(() => {
    let result = clients.filter((c) => subcanalIds.includes(c.subcanalId));
    if (blockIds.length > 0) {
      const selectedBlocks = blocks.filter((b) => blockIds.includes(b.id));
      result = result.filter((c) =>
        selectedBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)),
      );
    }
    return result;
  }, [clients, subcanalIds, blockIds, blocks]);
}

/** Average ticket and total drop size across a set of clients. */
export function computeSelectionMetrics(clients: Client[]) {
  if (clients.length === 0) return { avgTicket: 0, totalDrop: 0 };
  const avgTicket = Math.round(clients.reduce((a, c) => a + c.ticketPromedio, 0) / clients.length);
  const totalDrop = clients.reduce((a, c) => a + c.dropSize, 0);
  return { avgTicket, totalDrop };
}
