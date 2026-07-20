import type { Market, MarketInput } from "@/types";
import { SEED_MARKETS } from "@/data/seed";
import { delay, uid } from "@/lib/utils";

/**
 * In-memory mutable repository for markets, mirroring the routes service. Kept
 * at module level so mutations survive navigation within the session.
 */
let MARKETS: Market[] = [...SEED_MARKETS];

export const marketsService = {
  list: (): Promise<Market[]> => delay([...MARKETS], 400),

  get: (id: string): Promise<Market | undefined> =>
    delay(MARKETS.find((m) => m.id === id), 250),

  create: (input: MarketInput): Promise<Market> => {
    const now = new Date().toISOString();
    const market: Market = { id: uid("mkt"), ...input, createdAt: now, updatedAt: now };
    MARKETS = [market, ...MARKETS];
    return delay(market, 450);
  },

  update: (id: string, input: MarketInput): Promise<Market> => {
    const now = new Date().toISOString();
    let updated: Market | undefined;
    MARKETS = MARKETS.map((m) => {
      if (m.id !== id) return m;
      updated = { ...m, ...input, updatedAt: now };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Mercado no encontrado"));
    return delay(updated, 450);
  },

  remove: (id: string): Promise<{ id: string }> => {
    MARKETS = MARKETS.filter((m) => m.id !== id);
    return delay({ id }, 350);
  },
};
