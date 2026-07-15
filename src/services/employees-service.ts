import type { Employee, EmployeeStatus } from "@/types";
import { SEED_EMPLOYEES } from "@/data/seed";
import { delay } from "@/lib/utils";
import type { Paginated } from "./routes-service";

export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  status?: EmployeeStatus | "all";
  search?: string;
}

/** In-memory mutable repository, mirrors routesService. */
let EMPLOYEES: Employee[] = [...SEED_EMPLOYEES];

export const employeesService = {
  list: (): Promise<Employee[]> => delay([...EMPLOYEES], 400),

  listPaged: ({
    page = 1,
    limit = 8,
    status = "all",
    search = "",
  }: ListEmployeesParams = {}): Promise<Paginated<Employee>> => {
    const q = search.trim().toLowerCase();
    const filtered = EMPLOYEES.filter(
      (e) =>
        (status === "all" || e.status === status) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * limit, safePage * limit);
    return delay({ data, pagination: { page: safePage, limit, totalItems, totalPages } }, 450);
  },

  get: (id: string): Promise<Employee | undefined> =>
    delay(EMPLOYEES.find((e) => e.id === id), 300),

  /** Persists the employee's full route assignment (replace, not merge). */
  updateRoutes: (id: string, routeIds: string[]): Promise<Employee> => {
    const now = new Date().toISOString();
    let updated: Employee | undefined;
    EMPLOYEES = EMPLOYEES.map((e) => {
      if (e.id !== id) return e;
      updated = { ...e, routeIds, updatedAt: now };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Empleado no encontrado"));
    return delay(updated, 500);
  },
};
