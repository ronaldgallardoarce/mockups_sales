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
  routeMacros: ["route-macros"] as const,
  routeMacrosPaged: (params: { page: number; limit: number; search: string }) =>
    ["route-macros", "paged", params] as const,
  routeMacro: (id: number | string) => ["route-macros", id] as const,
  markets: ["markets"] as const,
  market: (id: string) => ["markets", id] as const,
  channels: ["channels"] as const,
  subcanales: ["subcanales"] as const,
  clients: ["clients"] as const,
  clientsBySubcanales: (ids: string[]) => ["clients", "sub", ...ids] as const,
  sellers: ["sellers"] as const,
  sellersPaged: (params: { page: number; limit: number; status: string; search: string }) =>
    ["sellers", "paged", params] as const,
  seller: (code: number | string) => ["sellers", code] as const,
  sellerDetail: (code: number | string) => ["sellers", code, "detail"] as const,
  clientTasks: ["client-tasks"] as const,
  clientTasksPaged: (params: { page: number; limit: number; status: string; type: string; search: string }) =>
    ["client-tasks", "paged", params] as const,
  clientTask: (id: number | string) => ["client-tasks", id] as const,
  clientTaskCompletions: (taskId: number | string) =>
    ["client-tasks", taskId, "completions"] as const,
  generalTasks: ["general-tasks"] as const,
  generalTasksPaged: (params: { page: number; limit: number; status: string; priority: string; search: string }) =>
    ["general-tasks", "paged", params] as const,
  generalTask: (id: number | string) => ["general-tasks", id] as const,
};
