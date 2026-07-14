import { useNavigate } from "react-router-dom";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Route } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RouteActionsProps {
  route: Route;
  onView: (route: Route) => void;
  onDuplicate: (route: Route) => void;
  onDelete: (route: Route) => void;
}

export function RouteActions({ route, onView, onDuplicate, onDelete }: RouteActionsProps) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(route)}>
          <Eye /> Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/routes/${route.id}/edit`)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(route)}>
          <Copy /> Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(route)}
        >
          <Trash2 /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
