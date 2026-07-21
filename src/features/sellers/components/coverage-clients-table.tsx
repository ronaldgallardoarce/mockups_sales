import { useMemo } from "react";
import { Ban, MapPinOff, Undo2, Users } from "lucide-react";
import type { Client } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel, getSubcanal } from "@/data/channels";
import { useBlocksStore } from "@/stores/blocks-store";
import { pointInPolygon } from "@/lib/geo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";

interface CoverageClientsTableProps {
  clients: Client[];
  subcanalIds: string[];
  blockIds: string[];
  excludedClientIds: Set<string>;
  manualClientIds: Set<string>;
  onToggleExclude: (client: Client) => void;
  onToggleManual: (client: Client) => void;
}

interface Row {
  client: Client;
  inside: boolean;
}

/** Table view of the seller's coverage clients, with include/exclude actions. */
export function CoverageClientsTable({
  clients,
  subcanalIds,
  blockIds,
  excludedClientIds,
  manualClientIds,
  onToggleExclude,
  onToggleManual,
}: CoverageClientsTableProps) {
  const blocks = useBlocksStore((s) => s.blocks);

  const rows = useMemo<Row[]>(() => {
    const selected = blocks.filter((b) => blockIds.includes(b.id));
    const isInside = (c: Client) =>
      blockIds.length === 0 || selected.some((b) => pointInPolygon([c.lat, c.lng], b.polygon));

    return clients
      .filter((c) => subcanalIds.includes(c.subcanalId))
      .map((client) => ({ client, inside: isInside(client) }))
      // Show clients inside the coverage, plus outside clients manually assigned.
      .filter(({ client, inside }) => inside || manualClientIds.has(client.id));
  }, [clients, subcanalIds, blockIds, blocks, manualClientIds]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin clientes en cobertura"
        description="Asigna rutas para ver sus clientes aquí."
        className="h-full justify-center"
      />
    );
  }

  return (
    <div className="h-full overflow-auto rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent">
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden sm:table-cell">Canal</TableHead>
            <TableHead className="w-32">Estado</TableHead>
            <TableHead className="w-28 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ client: c, inside }) => {
            const excluded = inside && excludedClientIds.has(c.id);
            const assigned = inside ? !excluded : manualClientIds.has(c.id);
            const channel = getChannel(c.channelId);
            return (
              <TableRow key={c.id} className={cn(!assigned && "bg-destructive/5")}>
                <TableCell>
                  <div className={cn("font-medium", !assigned && "text-muted-foreground line-through")}>
                    {c.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: channel?.color }} />
                    {channel?.name}
                    <span className="text-muted-foreground/60">· {getSubcanal(c.subcanalId)?.name}</span>
                  </span>
                </TableCell>
                <TableCell>
                  {excluded ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Excluido
                    </span>
                  ) : !inside ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <MapPinOff className="h-3 w-3" /> Fuera de ruta
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Incluido
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => (inside ? onToggleExclude(c) : onToggleManual(c))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                      assigned
                        ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                        : "border-primary/40 text-primary hover:bg-primary/10",
                    )}
                  >
                    {assigned ? (
                      <>
                        <Ban className="h-3.5 w-3.5" /> {inside ? "Excluir" : "Quitar"}
                      </>
                    ) : (
                      <>
                        <Undo2 className="h-3.5 w-3.5" /> Incluir
                      </>
                    )}
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
