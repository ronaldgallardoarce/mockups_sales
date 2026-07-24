import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, ClipboardList, Search, UserCheck, UserX } from "lucide-react";
import type { Client, ClientTask } from "@/types";
import { cn } from "@/lib/utils";
import { useAssignClientsToTasks } from "@/hooks/use-client-tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssignClientsToTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tasks that will receive the shared client set. */
  tasks: ClientTask[];
  /** Client ids resolved from the current route + block selection. */
  clientIds: string[];
  /** Every client — resolves ids to displayable rows. */
  clients: Client[];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

interface ClientRowProps {
  client: Client;
  side: "included" | "excluded";
  onToggle: (id: string) => void;
}

function ClientRow({ client, side, onToggle }: ClientRowProps) {
  const included = side === "included";
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(client.id)}
        title={included ? "Mover a excluidos" : "Mover a incluidos"}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs shadow-sm transition-colors",
          included ? "border-emerald-500/30 hover:border-emerald-500/60" : "border-border hover:border-primary/40",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            included ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
          )}
        >
          {initials(client.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 truncate font-medium">{client.name}</span>
            <span className="shrink-0 rounded-full border px-1 py-px text-[10px] font-medium text-muted-foreground">
              {client.code}
            </span>
          </div>
          <div className="truncate text-[10px] text-muted-foreground">{client.ownerName}</div>
        </div>
        <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

/**
 * Assign a shared client set to the selected tasks. Every resolved client starts
 * in "Incluidos"; the user moves clients to "Excluidos" by clicking (no drag —
 * the set can hold hundreds of clients). Confirming applies the Incluidos set to
 * every selected task.
 */
export function AssignClientsToTasksDialog({
  open,
  onOpenChange,
  tasks,
  clientIds,
  clients,
}: AssignClientsToTasksDialogProps) {
  const assign = useAssignClientsToTasks();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // Each open starts fresh: everything resolved goes into Incluidos.
  useEffect(() => {
    if (open) {
      setExcluded(new Set());
      setQuery("");
    }
  }, [open]);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const resolvedClients = useMemo(
    () => clientIds.map((id) => clientById.get(id)).filter((c): c is Client => !!c),
    [clientIds, clientById],
  );

  const q = query.trim().toLowerCase();
  const matches = (c: Client) =>
    !q ||
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    c.ownerName.toLowerCase().includes(q);

  const included = resolvedClients.filter((c) => !excluded.has(c.id));
  const excludedClients = resolvedClients.filter((c) => excluded.has(c.id));
  const includedShown = included.filter(matches);
  const excludedShown = excludedClients.filter(matches);

  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const includedIds = included.map((c) => c.id);

  const handleConfirm = () => {
    assign.mutate(
      { taskIds: tasks.map((t) => t.id), clientIds: includedIds },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Asignar tareas a clientes</DialogTitle>
          <DialogDescription>
            Los clientes en <span className="font-medium text-foreground">Incluidos</span> recibirán las
            tareas seleccionadas. Movelos entre columnas con un clic.
          </DialogDescription>
        </DialogHeader>

        {/* ---- Selected tasks pinned at the top ---- */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/30 p-2.5">
          <span className="flex items-center gap-1.5 pr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" /> Tareas ({tasks.length})
          </span>
          {tasks.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs font-medium"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
            </span>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente en ambas columnas…"
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {/* ---- Incluidos ---- */}
          <div className="flex min-h-0 flex-col rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between border-b p-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-3.5 w-3.5" /> Incluidos
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {included.length}
              </span>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {includedShown.length === 0 ? (
                <li className="py-8 text-center text-xs text-muted-foreground">
                  {included.length === 0 ? "Ningún cliente incluido." : "Sin coincidencias."}
                </li>
              ) : (
                includedShown.map((c) => (
                  <ClientRow key={c.id} client={c} side="included" onToggle={toggle} />
                ))
              )}
            </ul>
          </div>

          {/* ---- Excluidos ---- */}
          <div className="flex min-h-0 flex-col rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between border-b p-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <UserX className="h-3.5 w-3.5" /> Excluidos
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {excludedClients.length}
              </span>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {excludedShown.length === 0 ? (
                <li className="py-8 text-center text-xs text-muted-foreground">
                  {excludedClients.length === 0 ? "Ningún cliente excluido." : "Sin coincidencias."}
                </li>
              ) : (
                excludedShown.map((c) => (
                  <ClientRow key={c.id} client={c} side="excluded" onToggle={toggle} />
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {included.length} cliente(s) → {tasks.length} tarea(s)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={included.length === 0 || tasks.length === 0 || assign.isPending}
            >
              <Check className="h-4 w-4" /> Confirmar asignación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
