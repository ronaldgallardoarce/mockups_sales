import type { RouteMacro } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { RouteMacroActions } from "./route-macro-actions";

interface RouteMacrosTableProps {
  macros: RouteMacro[];
  loading?: boolean;
  onView: (macro: RouteMacro) => void;
  onDelete: (macro: RouteMacro) => void;
}

/** Up to 3 route chips inline, collapsing the rest into a "+N" pill. */
function RoutesCell({ macro }: { macro: RouteMacro }) {
  if (macro.routes.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin rutas</span>;
  }
  const shown = macro.routes.slice(0, 3);
  const rest = macro.routes.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((route) => (
        <span
          key={route.id}
          className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium"
        >
          <ColorDot color={route.color} className="h-2 w-2 shrink-0" />
          <span className="truncate">{route.name}</span>
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-full border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
}

export function RouteMacrosTable({ macros, loading, onView, onDelete }: RouteMacrosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead className="w-20 text-center">Rutas</TableHead>
            <TableHead>Rutas incluidas</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : macros.map((macro) => (
                <TableRow key={macro.id} className="group cursor-pointer" onClick={() => onView(macro)}>
                  <TableCell className="font-medium">{macro.name}</TableCell>
                  <TableCell className="text-center tabular-nums">{macro.routes.length}</TableCell>
                  <TableCell><RoutesCell macro={macro} /></TableCell>
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
