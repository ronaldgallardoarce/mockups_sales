import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, ClipboardCheck, Eye, MapPinned, MoreHorizontal } from "lucide-react";
import type { Seller } from "@/types";
import { Button } from "@/components/ui/button";
import { useSetSellerStatus } from "@/hooks/use-sellers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SellerCompletedTasksSheet } from "./seller-completed-tasks-sheet";

export function SellerActions({ seller }: { seller: Seller }) {
  const navigate = useNavigate();
  const setStatus = useSetSellerStatus();
  const active = seller.status === "ACTIVO";
  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/sellers/${seller.code}`)}>
            <Eye /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/sellers/${seller.code}/assign`)}>
            <MapPinned /> Asignar ruta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompletedOpen(true)}>
            <ClipboardCheck /> Tareas Completadas
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setStatus.mutate({ code: seller.code, status: active ? "INACTIVO" : "ACTIVO" })}
          >
            <ArrowLeftRight />
            {active ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SellerCompletedTasksSheet
        seller={seller}
        open={completedOpen}
        onOpenChange={setCompletedOpen}
      />
    </>
  );
}
