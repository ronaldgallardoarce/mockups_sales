import { CalendarClock, Check } from "lucide-react";
import type { ClientTaskType } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { ClientTaskTypeBadge } from "./client-task-type-badge";

interface ClientTaskPreviewProps {
  name: string;
  description: string;
  type: ClientTaskType;
  checklistItems: string[];
  color: string;
  order: number;
  required: boolean;
  dueDate?: string;
}

/** Live preview of how the task will look on the client's card during a visit. */
export function ClientTaskPreview({
  name,
  description,
  type,
  checklistItems,
  color,
  order,
  required,
  dueDate,
}: ClientTaskPreviewProps) {
  const items = checklistItems.filter((i) => i.trim() !== "");

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Vista previa
      </p>
      <p className="text-xs text-muted-foreground">Así se verá en la ficha del cliente.</p>

      <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="space-y-3 p-4 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <h4 className="truncate text-sm font-semibold">
                {name || "Nombre de la tarea"}
              </h4>
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              #{order}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ClientTaskTypeBadge type={type} />
            {required && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                Obligatoria
              </span>
            )}
          </div>

          {description.trim() !== "" && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {dueDate && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Vence: {formatDate(dueDate)}
            </p>
          )}

          {type === "checklist" && (
            <ul className="space-y-1.5">
              {items.length === 0 ? (
                <li className="text-xs italic text-muted-foreground/70">Sin ítems todavía</li>
              ) : (
                items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-input",
                      )}
                    >
                      <Check className="h-3 w-3 text-transparent" />
                    </span>
                    <span className="min-w-0 truncate">{item}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
