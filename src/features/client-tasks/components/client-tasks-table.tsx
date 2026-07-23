import type { ClientTask } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTaskTypeBadge } from "./client-task-type-badge";
import { ClientTaskStatusBadge } from "./client-task-status-badge";
import { ClientTaskActions } from "./client-task-actions";

interface ClientTasksTableProps {
  tasks: ClientTask[];
  loading?: boolean;
  onView: (task: ClientTask) => void;
  onDelete: (task: ClientTask) => void;
}

function assignmentLabel(task: ClientTask) {
  if (task.assignScope === "all") return "Todos";
  const n = task.clientIds.length;
  return `${n} ${n === 1 ? "cliente" : "clientes"}`;
}

export function ClientTasksTable({ tasks, loading, onView, onDelete }: ClientTasksTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-center">Orden</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-28 text-center">Obligatoria</TableHead>
            <TableHead>Asignación</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="mx-auto h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : tasks.map((task) => (
                <TableRow key={task.id} className="group cursor-pointer" onClick={() => onView(task)}>
                  <TableCell className="text-center tabular-nums text-muted-foreground">
                    {task.order}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: task.color }}
                        aria-hidden
                      />
                      <span className="truncate">{task.name}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <ClientTaskTypeBadge type={task.type} />
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {task.required ? "Sí" : "No"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{assignmentLabel(task)}</TableCell>
                  <TableCell>
                    <ClientTaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ClientTaskActions task={task} onView={onView} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
