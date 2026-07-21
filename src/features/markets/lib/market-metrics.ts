import type { Block, Client, Market } from "@/types";
import { pointInPolygon } from "@/lib/geo";

export interface MarketMetric {
  market: Market;
  blocks: Block[];
  /** Clients inside the market's manzanos. */
  clientCount: number;
  /** Average monthly ticket (Bs) across those clients. */
  avgTicket: number;
  /** Sum of single-visit sales (Bs) across those clients. */
  totalDrop: number;
}

/** Per-market sales metrics from the clients that fall inside each market's manzanos. */
export function computeMarketMetrics(
  markets: Market[],
  clients: Client[],
  allBlocks: Block[],
): MarketMetric[] {
  return markets.map((market) => {
    const blocks = allBlocks.filter((b) => market.blockIds.includes(b.id));
    const inside = clients.filter((c) => blocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)));
    const clientCount = inside.length;
    const avgTicket = clientCount
      ? Math.round(inside.reduce((a, c) => a + c.ticketPromedio, 0) / clientCount)
      : 0;
    const totalDrop = inside.reduce((a, c) => a + c.dropSize, 0);
    return { market, blocks, clientCount, avgTicket, totalDrop };
  });
}

/** Aggregate several markets' metrics (ticket weighted by client count). */
export function summarizeMarketMetrics(metrics: MarketMetric[]) {
  const clientCount = metrics.reduce((a, m) => a + m.clientCount, 0);
  const totalDrop = metrics.reduce((a, m) => a + m.totalDrop, 0);
  const weighted = metrics.reduce((a, m) => a + m.avgTicket * m.clientCount, 0);
  const avgTicket = clientCount ? Math.round(weighted / clientCount) : 0;
  return { marketCount: metrics.length, clientCount, avgTicket, totalDrop };
}

/** Format a number as Bolivian currency (Bs). */
export function bs(n: number) {
  return `Bs ${n.toLocaleString("es-BO")}`;
}
