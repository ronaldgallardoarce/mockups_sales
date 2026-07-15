import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Employee, EmployeeStatus } from "@/types";
import { employeesService, type ListEmployeesParams } from "@/services/employees-service";
import { queryKeys } from "@/lib/query-client";

export interface UseEmployeesPagedParams {
  page: number;
  limit: number;
  status: EmployeeStatus | "all";
  search: string;
}

/** Paginated + filtered employees for the list view. Keeps prior page while fetching. */
export function useEmployeesPaged(params: UseEmployeesPagedParams) {
  return useQuery({
    queryKey: queryKeys.employeesPaged(params),
    queryFn: () => employeesService.listPaged(params as ListEmployeesParams),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employee(id ?? "new"),
    queryFn: () => employeesService.get(id as string),
    enabled: !!id,
  });
}

export function useUpdateEmployeeRoutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, routeIds }: { id: string; routeIds: string[] }) =>
      employeesService.updateRoutes(id, routeIds),
    onSuccess: (employee: Employee) => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
      qc.invalidateQueries({ queryKey: queryKeys.employee(employee.id) });
      toast.success("Rutas asignadas", { description: employee.name });
    },
    onError: (e: Error) => toast.error("No se pudo guardar la asignación", { description: e.message }),
  });
}
