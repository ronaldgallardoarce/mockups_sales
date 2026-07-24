import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Check, ListChecks, Pencil, Users } from "lucide-react";
import type { ClientTask } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClients } from "@/hooks/use-clients";
import { ClientTaskTypeBadge } from "./client-task-type-badge";
import { ClientTaskStatusBadge } from "./client-task-status-badge";

interface ClientTaskDetailSheetProps {
  task: ClientTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientTaskDetailSheet({ task, open, onOpenChange }: ClientTaskDetailSheetProps) {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();

  const assignedClients = useMemo(() => {
    if (!task || task.assignScope !== "some") return [];
    const ids = new Set(task.clientIds);
    return clients.filter((c) => ids.has(c.id));
  }, [task, clients]);

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: task.color }}
              aria-hidden
            />
            <SheetTitle className="text-xl">{task.name}</SheetTitle>
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <ClientTaskStatusBadge status={task.status} />
            <ClientTaskTypeBadge type={task.type} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-6">
          <section className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border p-2.5">
              <p className="text-[11px] text-muted-foreground">Orden</p>
              <p className="text-sm font-semibold tabular-nums">{task.order}</p>
            </div>
            <div className="rounded-lg border p-2.5">
              <p className="text-[11px] text-muted-foreground">Obligatoria</p>
              <p className="text-sm font-semibold">{task.required ? "Sí" : "No"}</p>
            </div>
            {task.dueDate && (
              <div className="col-span-2 rounded-lg border p-2.5">
                <p className="text-[11px] text-muted-foreground">Fecha límite</p>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(task.dueDate)}
                </p>
              </div>
            )}
          </section>

          {task.description.trim() !== "" && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descripción
              </h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </section>
          )}

          {task.type === "checklist" && task.checklistItems.length > 0 && (
            <section className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" /> Checklist
              </h4>
              <ul className="space-y-1.5">
                {task.checklistItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-input">
                      <Check className="h-3 w-3 text-transparent" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator />

          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Asignación
            </h4>
            {task.assignScope === "all" ? (
              <p className="rounded-lg border px-3 py-2 text-sm">Todos los clientes</p>
            ) : (
              <div className="space-y-1.5">
                {assignedClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {task.clientIds.length} clientes seleccionados
                  </p>
                ) : (
                  assignedClients.map((c) => (
                    <div key={c.id} className="rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                        <span className="shrink-0 rounded-full border px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                          {c.code}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.ownerName}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(`/client-tasks/${task.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar tarea
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
