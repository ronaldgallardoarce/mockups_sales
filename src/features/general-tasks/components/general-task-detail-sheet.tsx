import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ListChecks, Pencil, Users } from "lucide-react";
import type { GeneralTask } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColorDot } from "@/components/common/channel-badge";
import { useAllSellers } from "@/hooks/use-sellers";
import { formatDate } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { GeneralTaskTypeBadge } from "./general-task-type-badge";
import { GeneralTaskStatusBadge } from "./general-task-status-badge";

interface GeneralTaskDetailSheetProps {
  task: GeneralTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function GeneralTaskDetailSheet({ task, open, onOpenChange }: GeneralTaskDetailSheetProps) {
  const navigate = useNavigate();
  const { data: allSellers = [] } = useAllSellers();

  const assignedSellers = useMemo(() => {
    if (!task || task.assignScope !== "some") return [];
    const codes = new Set(task.sellerCodes);
    return allSellers.filter((s) => codes.has(s.code));
  }, [task, allSellers]);

  if (!task) return null;

  const checklistItems = task.checklistItems.filter((i) => i.trim() !== "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ColorDot color={task.color} className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1">{task.title}</span>
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <GeneralTaskTypeBadge type={task.responseType} />
              <GeneralTaskStatusBadge status={task.status} />
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-6">
          {task.dueDate && (
            <Field label="Fecha de vencimiento">
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                {formatDate(task.dueDate)}
              </p>
            </Field>
          )}

          <Field label="Descripción">
            {task.description ? (
              <p className="whitespace-pre-line text-muted-foreground">{task.description}</p>
            ) : (
              <p className="text-muted-foreground">Sin descripción.</p>
            )}
          </Field>

          {task.responseType === "checklist" && (
            <>
              <Separator />
              <Field label="Checklist">
                {checklistItems.length > 0 ? (
                  <ul className="space-y-1.5">
                    {checklistItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Sin ítems.</p>
                )}
              </Field>
            </>
          )}

          <Separator />

          <Field label="Asignación">
            {task.assignScope === "all" ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" /> Todos los vendedores
              </p>
            ) : (
              <div className="space-y-1.5">
                {assignedSellers.length === 0 ? (
                  <p className="text-muted-foreground">Sin vendedores asignados.</p>
                ) : (
                  assignedSellers.map((s) => (
                    <div key={s.code} className="rounded-lg border px-3 py-2">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Field>

          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(`/general-tasks/${task.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar tarea
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
