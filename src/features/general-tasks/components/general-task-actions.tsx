import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { GeneralTask } from "@/types";
import { Button } from "@/components/ui/button";
import { useSetGeneralTaskStatus } from "@/hooks/use-general-tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GeneralTaskActionsProps {
  task: GeneralTask;
  onView: (task: GeneralTask) => void;
  onDelete: (task: GeneralTask) => void;
}

export function GeneralTaskActions({ task, onView, onDelete }: GeneralTaskActionsProps) {
  const navigate = useNavigate();
  const setStatus = useSetGeneralTaskStatus();
  const active = task.status === "active";

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
        <DropdownMenuItem onClick={() => navigate(`/general-tasks/${task.id}/edit`)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setStatus.mutate({ id: task.id, status: active ? "inactive" : "active" })}
        >
          <ArrowLeftRight />
          {active ? "Desactivar" : "Activar"}
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
