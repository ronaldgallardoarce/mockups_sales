import type { GeneralTask } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { formatDate } from "@/lib/utils";
import { GeneralTaskTypeBadge } from "./general-task-type-badge";
import { PriorityBadge } from "./priority-badge";
import { GeneralTaskStatusBadge } from "./general-task-status-badge";
import { GeneralTaskActions } from "./general-task-actions";

interface GeneralTasksTableProps {
  tasks: GeneralTask[];
  loading?: boolean;
  onView: (task: GeneralTask) => void;
  onDelete: (task: GeneralTask) => void;
}

function assignmentLabel(task: GeneralTask) {
  if (task.assignScope === "all") return "Todos";
  return `${task.sellerCodes.length} vendedores`;
}

export function GeneralTasksTable({ tasks, loading, onView, onDelete }: GeneralTasksTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead>Asignación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : tasks.map((task) => (
                <TableRow key={task.id} className="group cursor-pointer" onClick={() => onView(task)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ColorDot color={task.color} className="h-2.5 w-2.5 shrink-0" />
                      <span className="min-w-0 truncate">{task.title}</span>
                    </div>
                  </TableCell>
                  <TableCell><GeneralTaskTypeBadge type={task.responseType} /></TableCell>
                  <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.dueDate ? formatDate(task.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{assignmentLabel(task)}</TableCell>
                  <TableCell><GeneralTaskStatusBadge status={task.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <GeneralTaskActions task={task} onView={onView} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
