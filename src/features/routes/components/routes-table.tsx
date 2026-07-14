import type { Route } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "./status-badge";
import { RouteActions } from "./route-actions";

interface RoutesTableProps {
  routes: Route[];
  loading?: boolean;
  onView: (route: Route) => void;
  onDuplicate: (route: Route) => void;
  onDelete: (route: Route) => void;
}

export function RoutesTable({ routes, loading, onView, onDuplicate, onDelete }: RoutesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead className="w-28">Color</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : routes.map((route) => (
                <TableRow key={route.id} className="group cursor-pointer" onClick={() => onView(route)}>
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <ColorDot color={route.color} className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs uppercase text-muted-foreground">
                        {route.color}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell><StatusBadge status={route.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RouteActions
                      route={route}
                      onView={onView}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
