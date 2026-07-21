import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Crosshair, MapPinOff, UserCheck, Users, X } from "lucide-react";
import type { Client, Route, Seller } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel } from "@/data/channels";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SellerReassignPanel } from "./seller-reassign-panel";

interface RouteClientsModalProps {
  route: Route | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Client the modal was opened from (e.g. a map pin) — highlighted and scrolled to. */
  focusClientId?: string | null;
  excludedClientIds: Set<string>;
  manualClientIds: Set<string>;
  /** Sellers that can take over an excluded client. */
  sellers: Seller[];
  /** Excluded client id -> code of the seller that will attend it. */
  reassignments: Record<string, number>;
  /** Exclude a client and assign the seller that will attend it (single step). */
  onReassign: (client: Client, sellerCode: number) => void;
  /** Re-include a previously excluded client. */
  onInclude: (client: Client) => void;
  /** Set/clear a client as manually assigned (used for clients outside the route). */
  setClientManual: (clientId: string, manual: boolean) => void;
}

type Column = "assigned" | "unassigned";

/** A client enriched with whether it falls inside the route's manzanos. */
interface ClientRow {
  client: Client;
  inside: boolean;
}

/**
 * Per-route client manager: two columns (assigned / not assigned) with native
 * drag-and-drop (plus click buttons) to move clients between them.
 *   - inside the route  -> toggles exclusion
 *   - outside the route -> toggles manual assignment
 */
export function RouteClientsModal({
  route,
  open,
  onOpenChange,
  focusClientId,
  excludedClientIds,
  manualClientIds,
  sellers,
  reassignments,
  onReassign,
  onInclude,
  setClientManual,
}: RouteClientsModalProps) {
  const blocks = useBlocksStore((s) => s.blocks);
  const { data: clients = [] } = useClientsBySubcanales(route?.subcanalIds ?? []);
  const [dragOver, setDragOver] = useState<Column | null>(null);
  const focusRef = useRef<HTMLLIElement | null>(null);
  // Client dropped into "No asignado" awaiting a replacement seller before the
  // exclusion is committed — enforces the mandatory reassignment on drag & drop.
  const [pendingExclude, setPendingExclude] = useState<Client | null>(null);
  const replacementName = (clientId: string) =>
    sellers.find((s) => s.code === reassignments[clientId])?.name;

  const rows = useMemo<ClientRow[]>(() => {
    if (!route) return [];
    const routeBlocks = blocks.filter((b) => route.blockIds.includes(b.id));
    return clients.map((client) => ({
      client,
      inside: routeBlocks.some((b) => pointInPolygon([client.lat, client.lng], b.polygon)),
    }));
  }, [route, clients, blocks]);

  const { assigned, unassigned } = useMemo(() => {
    const a: ClientRow[] = [];
    const u: ClientRow[] = [];
    for (const row of rows) {
      const isAssigned = row.inside
        ? !excludedClientIds.has(row.client.id)
        : manualClientIds.has(row.client.id);
      (isAssigned ? a : u).push(row);
    }
    return { assigned: a, unassigned: u };
  }, [rows, excludedClientIds, manualClientIds]);

  // Bring the client we came from (a map pin) into view when the modal opens.
  useEffect(() => {
    if (open && focusClientId && focusRef.current) {
      focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [open, focusClientId, assigned, unassigned]);

  /** Apply a move of one client to the target column. */
  const moveTo = (row: ClientRow, target: Column) => {
    if (row.inside) {
      // Excluding an inside client always requires choosing who attends it.
      if (target === "unassigned") setPendingExclude(row.client);
      else onInclude(row.client);
    } else {
      setClientManual(row.client.id, target === "assigned");
    }
  };

  const handleDrop = (target: Column, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const row = rows.find((r) => r.client.id === id);
    if (row) moveTo(row, target);
  };

  const renderCard = (row: ClientRow, column: Column) => {
    const { client, inside } = row;
    const channel = getChannel(client.channelId);
    // Client currently being reassigned stays highlighted in the assigned list.
    const isPending = pendingExclude?.id === client.id;
    // Client we arrived from (map pin) — highlighted and scrolled into view.
    const isFocus = focusClientId === client.id;
    return (
      <li
        key={client.id}
        ref={isFocus ? focusRef : undefined}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", client.id)}
        className={cn(
          "group flex cursor-grab items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-xs shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing",
          isPending && "border-primary bg-primary/5 ring-2 ring-primary/30",
          isFocus && !isPending && "border-primary ring-2 ring-primary/40",
        )}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: channel?.color }} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{client.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-mono">{client.code}</span>
            {isFocus && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-px font-medium text-primary">
                <Crosshair className="h-2.5 w-2.5" /> Seleccionado
              </span>
            )}
            {!inside && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1 py-px font-medium text-amber-600 dark:text-amber-400">
                <MapPinOff className="h-2.5 w-2.5" /> Fuera de ruta
              </span>
            )}
            {inside && column === "unassigned" && (
              <>
                <span className="rounded bg-destructive/10 px-1 py-px font-medium text-destructive">
                  Excluido
                </span>
                <span className="inline-flex items-center gap-0.5 font-medium text-primary">
                  <UserCheck className="h-2.5 w-2.5" />
                  Atiende: {replacementName(client.id) ?? "sin asignar"}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => moveTo(row, column === "assigned" ? "unassigned" : "assigned")}
          className={cn(
            "shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100",
            inside && column === "assigned"
              ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          title={column === "assigned" ? "Quitar de la ruta" : "Asignar a la ruta"}
          aria-label={column === "assigned" ? "Quitar de la ruta" : "Asignar a la ruta"}
        >
          {column === "assigned" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
        </button>
      </li>
    );
  };

  const renderColumn = (column: Column, title: string, items: ClientRow[]) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(column);
      }}
      onDragLeave={() => setDragOver((c) => (c === column ? null : c))}
      onDrop={(e) => handleDrop(column, e)}
      className={cn(
        "flex min-h-0 flex-col rounded-xl border bg-muted/20 transition-colors",
        dragOver === column && "border-primary bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {column === "assigned" ? <Users className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {title}
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{items.length}</span>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {items.length === 0 ? (
          <li className="py-8 text-center text-xs text-muted-foreground">
            Arrastra clientes aquí.
          </li>
        ) : (
          items.map((row) => renderCard(row, column))
        )}
      </ul>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: route?.color }} />
            Clientes de {route?.name}
          </DialogTitle>
          <DialogDescription>
            Arrastra o usa las flechas para asignar o quitar clientes de la ruta. Los de
            <span className="font-medium"> fuera de ruta</span> pertenecen a sus subcanales pero caen fuera de sus manzanos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[60vh] grid-cols-1 gap-3 sm:grid-cols-2">
          {renderColumn("assigned", "Asignados", assigned)}
          {pendingExclude ? (
            // Excluding replaces the "No asignados" column with the picker until a
            // seller is chosen (or cancelled) — never excludes without one.
            <SellerReassignPanel
              client={pendingExclude}
              sellers={sellers}
              value={reassignments[pendingExclude.id]}
              onSelect={(sellerCode) => {
                onReassign(pendingExclude, sellerCode);
                setPendingExclude(null);
              }}
              onCancel={() => setPendingExclude(null)}
            />
          ) : (
            renderColumn("unassigned", "No asignados", unassigned)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
