import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Eye, MoreHorizontal, Pencil } from "lucide-react";
import type { Route } from "@/types";
import { Button } from "@/components/ui/button";
import { useSetRouteStatus } from "@/hooks/use-routes";
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
}

export function RouteActions({ route, onView }: RouteActionsProps) {
  const navigate = useNavigate();
  const setStatus = useSetRouteStatus();
  const active = route.status === "active";

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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setStatus.mutate({ id: route.id, status: active ? "inactive" : "active" })}
        >
          <ArrowLeftRight />
          {active ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
