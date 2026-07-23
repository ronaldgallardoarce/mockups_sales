import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import type { ClientTask } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetClientTaskStatus } from "@/hooks/use-client-tasks";

interface ClientTaskActionsProps {
  task: ClientTask;
  onView: (task: ClientTask) => void;
  onDelete: (task: ClientTask) => void;
}

export function ClientTaskActions({ task, onView, onDelete }: ClientTaskActionsProps) {
  const navigate = useNavigate();
  const setStatus = useSetClientTaskStatus();
  const isActive = task.status === "active";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(task)}>
          <Eye /> Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/client-tasks/${task.id}/edit`)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            setStatus.mutate({ id: task.id, status: isActive ? "inactive" : "active" })
          }
        >
          {isActive ? <PowerOff /> : <Power />}
          {isActive ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(task)}
        >
          <Trash2 /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
