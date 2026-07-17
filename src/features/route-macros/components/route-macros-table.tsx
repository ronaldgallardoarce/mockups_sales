import type { Route, RouteMacro } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { RouteMacroActions } from "./route-macro-actions";

interface RouteMacrosTableProps {
  macros: RouteMacro[];
  /** Route lookup used to derive the manzano count per macro. */
  routesById: Map<string, Route>;
  loading?: boolean;
  onView: (macro: RouteMacro) => void;
  onDelete: (macro: RouteMacro) => void;
}

/** Distinct manzanos (blocks) across all routes of the macro. */
function countBlocks(macro: RouteMacro, routesById: Map<string, Route>): number {
  const blocks = new Set<string>();
  for (const id of macro.routeIds) {
    const route = routesById.get(id);
    route?.blockIds.forEach((b) => blocks.add(b));
  }
  return blocks.size;
}

export function RouteMacrosTable({
  macros,
  routesById,
  loading,
  onView,
  onDelete,
}: RouteMacrosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead className="w-28 text-center">Rutas</TableHead>
            <TableHead className="w-28 text-center">Manzanos</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : macros.map((macro) => (
                <TableRow key={macro.id} className="group cursor-pointer" onClick={() => onView(macro)}>
                  <TableCell className="font-medium">{macro.name}</TableCell>
                  <TableCell className="text-center tabular-nums">{macro.routeIds.length}</TableCell>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {countBlocks(macro, routesById)}
                  </TableCell>
                  <TableCell><StatusBadge status={macro.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RouteMacroActions macro={macro} onView={onView} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
