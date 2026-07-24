import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import type { Client, ClientTask } from "@/types";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/use-clients";
import { useClientTasks, useUnassignClient } from "@/hooks/use-client-tasks";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface UnassignClientsSheetProps {
  /** Task whose assigned clients are being edited (null closes the sheet). */
  task: ClientTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Latest version of a task from the cache, so removals reflect immediately. */
function useLiveTask(task: ClientTask | null): ClientTask | null {
  const { data: tasks = [] } = useClientTasks();
  return useMemo(() => {
    if (!task) return null;
    return tasks.find((t) => t.id === task.id) ?? task;
  }, [task, tasks]);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/**
 * Per-task view of the currently assigned clients, each removable with an X.
 * Independent per task; reads the task's live `clientIds` from the cache so
 * removals reflected by the mutation update the list immediately.
 */
export function UnassignClientsSheet({ task: taskProp, open, onOpenChange }: UnassignClientsSheetProps) {
  const { data: clients = [] } = useClients();
  const unassign = useUnassignClient();
  const [query, setQuery] = useState("");
  const task = useLiveTask(taskProp);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const assigned = useMemo(() => {
    if (!task) return [];
    return task.clientIds
      .map((id) => clientById.get(id))
      .filter((c): c is Client => !!c);
  }, [task, clientById]);

  const q = query.trim().toLowerCase();
  const shown = assigned.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q),
  );

  if (!task) return null;

  const scopeAll = task.assignScope === "all";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: task.color }}
              aria-hidden
            />
            <SheetTitle className="text-lg">{task.name}</SheetTitle>
          </div>
          <SheetDescription className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Quitar clientes asignados a esta tarea.
          </SheetDescription>
        </SheetHeader>

        {scopeAll ? (
          <div className="p-6">
            <p className="rounded-lg border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
              Esta tarea está asignada a <span className="font-medium text-foreground">todos los clientes</span>.
              No hay clientes individuales para quitar.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 border-b p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cliente…"
                  className="h-9 pl-8 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {assigned.length} cliente(s) asignado(s)
              </p>
            </div>

            <ul className="flex-1 space-y-1.5 overflow-y-auto p-4">
              {shown.length === 0 ? (
                <li className="py-10 text-center text-sm text-muted-foreground">
                  {assigned.length === 0 ? "Sin clientes asignados." : "Sin coincidencias."}
                </li>
              ) : (
                shown.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-xs shadow-sm",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium">{c.name}</span>
                        <span className="shrink-0 rounded-full border px-1 py-px text-[10px] font-medium text-muted-foreground">
                          {c.code}
                        </span>
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">{c.ownerName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => unassign.mutate({ taskId: task.id, clientId: c.id })}
                      disabled={unassign.isPending}
                      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      title="Quitar de la tarea"
                      aria-label={`Quitar ${c.name} de la tarea`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
