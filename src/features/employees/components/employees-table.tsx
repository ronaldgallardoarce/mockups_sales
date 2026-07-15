import { Mail, MapPinned, Phone } from "lucide-react";
import type { Employee } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { EmployeeActions } from "./employee-actions";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

interface EmployeesTableProps {
  employees: Employee[];
  loading?: boolean;
  onAssignRoute: (employee: Employee) => void;
}

export function EmployeesTable({ employees, loading, onAssignRoute }: EmployeesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Empleado</TableHead>
            <TableHead className="hidden md:table-cell">Rol</TableHead>
            <TableHead className="hidden lg:table-cell">Contacto</TableHead>
            <TableHead className="w-32">Rutas</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : employees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="group cursor-pointer"
                  onClick={() => onAssignRoute(employee)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{employee.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{employee.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{employee.role}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {employee.email}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {employee.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.routeIds.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium">
                        <MapPinned className="h-3 w-3" />
                        {employee.routeIds.length}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin rutas</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={employee.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <EmployeeActions employee={employee} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
