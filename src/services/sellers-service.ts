import type { Seller, SellerStatus } from "@/types";
import { SEED_SELLERS } from "@/data/seed";
import { delay } from "@/lib/utils";
import type { Paginated } from "./routes-service";

export interface ListSellersParams {
  page?: number;
  limit?: number;
  status?: SellerStatus | "all";
  search?: string;
}

/** In-memory mutable repository, mirrors routesService. */
let SELLERS: Seller[] = [...SEED_SELLERS];

export const sellersService = {
  list: (): Promise<Seller[]> => delay([...SELLERS], 400),

  listPaged: ({
    page = 1,
    limit = 8,
    status = "all",
    search = "",
  }: ListSellersParams = {}): Promise<Paginated<Seller>> => {
    const q = search.trim().toLowerCase();
    const filtered = SELLERS.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          String(s.code).includes(q) ||
          s.email.toLowerCase().includes(q)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * limit, safePage * limit);
    return delay({ data, pagination: { page: safePage, limit, totalItems, totalPages } }, 450);
  },

  get: (code: number): Promise<Seller | undefined> =>
    delay(SELLERS.find((s) => s.code === code), 300),

  /** Persists the seller's full route assignment (replace, not merge). */
  updateRoutes: (code: number, routeIds: string[]): Promise<Seller> => {
    let updated: Seller | undefined;
    SELLERS = SELLERS.map((s) => {
      if (s.code !== code) return s;
      updated = { ...s, routeIds };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Vendedor no encontrado"));
    return delay(updated, 500);
  },
};
