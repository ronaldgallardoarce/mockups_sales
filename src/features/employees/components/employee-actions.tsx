import { useNavigate } from "react-router-dom";
import { MapPinned, MoreHorizontal } from "lucide-react";
import type { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EmployeeActions({ employee }: { employee: Employee }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate(`/employees/${employee.id}/assign`)}>
          <MapPinned /> Asignar ruta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
