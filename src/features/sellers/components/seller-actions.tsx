import { useNavigate } from "react-router-dom";
import { Eye, MapPinned, MoreHorizontal } from "lucide-react";
import type { Seller } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SellerActions({ seller }: { seller: Seller }) {
  const navigate = useNavigate();
  return (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/sellers/${seller.code}/assign`)}>
          <MapPinned /> Asignar ruta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
