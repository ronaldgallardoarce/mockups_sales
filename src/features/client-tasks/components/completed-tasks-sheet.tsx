import { useState } from "react";
import { ImageOff, Star, Store, User } from "lucide-react";
import type { ClientTask, CompletedClientTask, VisitTaskPhoto } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useClientTaskCompletions } from "@/hooks/use-client-tasks";
import { ClientTaskTypeBadge } from "./client-task-type-badge";

interface CompletedTasksSheetProps {
  task: ClientTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A photo thumbnail that falls back to a placeholder tile when the URL fails. */
function PhotoThumb({ photo }: { photo: VisitTaskPhoto }) {
  const [failed, setFailed] = useState(false);
  if (failed || !photo.url || photo.url === "url") {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={photo.url}
      alt="Evidencia"
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-square w-full rounded-md border object-cover"
    />
  );
}

/** 1–5 star rating, filled up to `value`. */
function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums text-muted-foreground">{value}/5</span>
    </div>
  );
}

function CompletionEvidence({ completion }: { completion: CompletedClientTask }) {
  const { response, checkListResponse, ratingResponse, visitTaskPhotos } = completion;

  return (
    <div className="space-y-2">
      {response && <p className="text-sm">{response}</p>}

      {checkListResponse && checkListResponse.length > 0 && (
        <ul className="space-y-1">
          {checkListResponse.map((entry, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px]",
                  entry.checked
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-input text-transparent",
                )}
              >
                ✓
              </span>
              <span
                className={cn("min-w-0 flex-1 truncate", !entry.checked && "text-muted-foreground")}
              >
                {entry.item}
              </span>
            </li>
          ))}
        </ul>
      )}

      {ratingResponse != null && <Rating value={ratingResponse} />}

      {visitTaskPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {visitTaskPhotos.map((photo) => (
            <PhotoThumb key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Shows every completion (visit response) recorded for a single task, across
 * the different employees that performed it. Each card highlights the employee
 * and the customer (with its owner) plus the evidence for that task type.
 */
export function CompletedTasksSheet({ task, open, onOpenChange }: CompletedTasksSheetProps) {
  const { data: completions = [], isLoading } = useClientTaskCompletions(open ? task?.id : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: task?.color }}
              aria-hidden
            />
            <SheetTitle className="text-xl">{task?.name}</SheetTitle>
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {task && <ClientTaskTypeBadge type={task.type} />}
            <span>
              {isLoading
                ? "Cargando completados…"
                : `Completada por ${completions.length} empleado(s)`}
            </span>
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
              Todavía nadie completó esta tarea.
            </p>
          ) : (
            completions.map((completion) => (
              <article
                key={completion.visitId}
                className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{completion.employeeName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Empleado #{completion.employeeId}
                    </p>
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
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
