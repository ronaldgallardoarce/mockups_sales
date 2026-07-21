import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, MoreHorizontal, Pencil } from "lucide-react";
import type { Market } from "@/types";
import { Button } from "@/components/ui/button";
import { useSetMarketStatus } from "@/hooks/use-markets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MarketActions({ market }: { market: Market }) {
  const navigate = useNavigate();
  const setStatus = useSetMarketStatus();
  const active = market.status === "active";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate(`/markets/${market.id}/edit`)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setStatus.mutate({ id: market.id, status: active ? "inactive" : "active" })}
        >
          <ArrowLeftRight />
          {active ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
