import { useMemo } from "react";
import { Store } from "lucide-react";
import type { Seller } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSellerCompletions } from "@/hooks/use-sellers";
import { useClientTasks } from "@/hooks/use-client-tasks";
import { ClientTaskTypeBadge } from "@/features/client-tasks/components/client-task-type-badge";
import { CompletionEvidence } from "@/features/client-tasks/components/completed-tasks-sheet";

interface SellerCompletedTasksSheetProps {
  seller: Seller | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Tasks completed by a single employee, across the customers they visited.
 * Mirror of the task-list "Completados" view, but scoped by employee: each card
 * leads with the task (name + type) and shows the customer, owner and evidence.
 */
export function SellerCompletedTasksSheet({
  seller,
  open,
  onOpenChange,
}: SellerCompletedTasksSheetProps) {
  const { data: completions = [], isLoading } = useSellerCompletions(
    open ? seller?.code : undefined,
  );
  const { data: tasks = [] } = useClientTasks();
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-1 border-b p-6 text-left">
          <SheetTitle className="text-xl">Tareas Completadas</SheetTitle>
          <SheetDescription>
            {seller?.name}
            {" · "}
            {isLoading ? "Cargando…" : `${completions.length} tarea(s) completada(s)`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 p-6">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </>
          ) : completions.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Este vendedor no completó tareas todavía.
            </p>
          ) : (
            completions.map((completion) => {
              const task = taskById.get(completion.visitTaskId);
              return (
                <article
                  key={completion.visitId}
                  className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: task?.color ?? "#94a3b8" }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {task?.name ?? `Tarea #${completion.visitTaskId}`}
                      </p>
                      {task && (
                        <div className="mt-1">
                          <ClientTaskTypeBadge type={task.type} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{completion.customerName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Dueño: {completion.ownerName}
                      </p>
                    </div>
                  </div>

                  <CompletionEvidence completion={completion} />
                </article>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
