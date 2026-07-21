import type { Route } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelBadge, ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "./status-badge";
import { RouteActions } from "./route-actions";
import { formatRouteCode } from "../lib/route-code";

// Shows up to 2 channel badges inline (backend `saleChannels`), collapsing the
// rest into a "+N" pill.
function ChannelCell({ channelIds }: { channelIds: string[] }) {
  if (channelIds.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin canal</span>;
  }
  const shown = channelIds.slice(0, 2);
  const rest = channelIds.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((id) => (
        <ChannelBadge key={id} channelId={id} />
      ))}
      {rest > 0 && (
        <span className="rounded-full border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
}

interface RoutesTableProps {
  routes: Route[];
  loading?: boolean;
  onView: (route: Route) => void;
}

export function RoutesTable({ routes, loading, onView }: RoutesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead>Canal de venta</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : routes.map((route) => (
                <TableRow key={route.id} className="group cursor-pointer" onClick={() => onView(route)}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2.5">
                      {/* Color folded into the name as an accent dot instead of its own column. */}
                      <ColorDot color={route.color} className="h-3 w-3 shrink-0" />
                      {/* Route code as plain text: SC-FE-PA-123-Zona Norte. */}
                      {formatRouteCode(route)}
                    </span>
                  </TableCell>
                  <TableCell><ChannelCell channelIds={route.channelIds} /></TableCell>
                  <TableCell className="text-muted-foreground">{route.provinceName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{route.cityName ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={route.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RouteActions route={route} onView={onView} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
