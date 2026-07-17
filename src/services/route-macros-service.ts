import type { RouteMacro, RouteMacroInput, RouteStatus } from "@/types";
import { SEED_ROUTE_MACROS } from "@/data/seed";
import { delay, uid } from "@/lib/utils";
import type { Paginated } from "./routes-service";

export interface ListRouteMacrosParams {
  page?: number;
  limit?: number;
  status?: RouteStatus | "all";
  search?: string;
}

/**
 * In-memory mutable repository standing in for the sale.route_macros REST
 * resource. Kept module level so mutations survive navigation within the session.
 */
let MACROS: RouteMacro[] = [...SEED_ROUTE_MACROS];

export const routeMacrosService = {
  list: (): Promise<RouteMacro[]> => delay([...MACROS], 500),

  /** Server-style paginated + filtered list (as the real API returns it). */
  listPaged: ({
    page = 1,
    limit = 8,
    status = "all",
    search = "",
  }: ListRouteMacrosParams = {}): Promise<Paginated<RouteMacro>> => {
    const q = search.trim().toLowerCase();
    const filtered = MACROS.filter(
      (m) =>
        (status === "all" || m.status === status) &&
        (!q || m.name.toLowerCase().includes(q)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * limit, safePage * limit);
    return delay({ data, pagination: { page: safePage, limit, totalItems, totalPages } }, 450);
  },

  get: (id: string): Promise<RouteMacro | undefined> =>
    delay(MACROS.find((m) => m.id === id), 300),

  create: (input: RouteMacroInput): Promise<RouteMacro> => {
    const now = new Date().toISOString();
    const macro: RouteMacro = {
      id: uid("mrt"),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    MACROS = [macro, ...MACROS];
    return delay(macro, 500);
  },

  update: (id: string, input: RouteMacroInput): Promise<RouteMacro> => {
    const now = new Date().toISOString();
    let updated: RouteMacro | undefined;
    MACROS = MACROS.map((m) => {
      if (m.id !== id) return m;
      updated = { ...m, ...input, updatedAt: now };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Macroruta no encontrada"));
    return delay(updated, 500);
  },

  remove: (id: string): Promise<{ id: string }> => {
    MACROS = MACROS.filter((m) => m.id !== id);
    return delay({ id }, 400);
  },
};
