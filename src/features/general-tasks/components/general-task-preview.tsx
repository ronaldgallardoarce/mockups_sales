import { CalendarClock, ListChecks } from "lucide-react";
import type { GeneralTaskResponseType, TaskPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "./priority-badge";
import { GeneralTaskTypeBadge } from "./general-task-type-badge";

interface GeneralTaskPreviewProps {
  title: string;
  description?: string;
  responseType: GeneralTaskResponseType;
  checklistItems: string[];
  priority: TaskPriority;
  color: string;
  dueDate?: string;
}

export function GeneralTaskPreview({
  title,
  description,
  responseType,
  checklistItems,
  priority,
  color,
  dueDate,
}: GeneralTaskPreviewProps) {
  const items = checklistItems.filter((i) => i.trim() !== "");

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Vista previa
      </h4>
      <Card className="overflow-hidden">
        {/* Colored accent strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: color }}
            />
            <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">
              {title || <span className="text-muted-foreground">Título de la tarea</span>}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={priority} />
            <GeneralTaskTypeBadge type={responseType} />
          </div>

          {dueDate && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Vence: {formatDate(dueDate)}
            </p>
          )}

          {description && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{description}</p>
          )}

          {responseType === "checklist" && items.length > 0 && (
            <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" /> Checklist
              </p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-[4px] border border-input" />
                    <span className="min-w-0 truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
