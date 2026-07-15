import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  routes: ["routes"] as const,
  routesPaged: (params: { page: number; limit: number; status: string; search: string }) =>
    ["routes", "paged", params] as const,
  route: (id: string) => ["routes", id] as const,
  channels: ["channels"] as const,
  subcanales: ["subcanales"] as const,
  clients: ["clients"] as const,
  clientsBySubcanales: (ids: string[]) => ["clients", "sub", ...ids] as const,
  employees: ["employees"] as const,
  employeesPaged: (params: { page: number; limit: number; status: string; search: string }) =>
    ["employees", "paged", params] as const,
  employee: (id: string) => ["employees", id] as const,
};
