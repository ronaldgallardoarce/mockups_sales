import type { Route } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "./status-badge";
import { RouteActions } from "./route-actions";

// Shows up to 2 channel badges inline, collapsing the rest into a "+N" pill.
// Kept for when the "Canal de venta" column below is re-enabled.
// function ChannelCell({ channelIds }: { channelIds: string[] }) {
//   if (channelIds.length === 0) {
//     return <span className="text-xs text-muted-foreground">Sin canal</span>;
//   }
//   const shown = channelIds.slice(0, 2);
//   const rest = channelIds.length - shown.length;
//   return (
//     <div className="flex flex-wrap items-center gap-1">
//       {shown.map((id) => (
//         <ChannelBadge key={id} channelId={id} />
//       ))}
//       {rest > 0 && (
//         <span className="rounded-full border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
//           +{rest}
//         </span>
//       )}
//     </div>
//   );
// }

interface RoutesTableProps {
  routes: Route[];
  loading?: boolean;
  onView: (route: Route) => void;
  onDelete: (route: Route) => void;
}

export function RoutesTable({ routes, loading, onView, onDelete }: RoutesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead className="w-28">Color</TableHead>
            {/* <TableHead>Canal de venta</TableHead> */}
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
                  {/* <TableCell><Skeleton className="h-5 w-32" /></TableCell> */}
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
                  {/* <TableCell><ChannelCell channelIds={route.channelIds} /></TableCell> */}
                  <TableCell><StatusBadge status={route.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RouteActions route={route} onView={onView} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
