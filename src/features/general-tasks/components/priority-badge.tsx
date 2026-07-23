import type { TaskPriority } from "@/types";
import { TASK_PRIORITY_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  baja: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  normal: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  alta: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  urgente: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PRIORITY_STYLES[priority],
      )}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
