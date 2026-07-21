import type { Market } from "@/types";
import { cn, numId } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { MarketActions } from "./market-actions";

interface MarketsTableProps {
  markets: Market[];
  loading?: boolean;
  canEdit?: boolean;
}

export function MarketsTable({ markets, loading, canEdit }: MarketsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Ciudad</TableHead>
            {canEdit && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  {canEdit && <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>}
                </TableRow>
              ))
            : markets.map((m) => {
                const active = m.status === "active";
                return (
                  <TableRow key={m.id} className={cn(!active && "opacity-60")}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{numId(m.id)}</TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <ColorDot color={m.color} className="h-3 w-3 shrink-0" />
                        {m.name}
                        {!active && (
                          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                            Inactivo
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.departmentName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.cityName ?? "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <MarketActions market={m} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
