import { useNavigate } from "react-router-dom";
import { CalendarDays, Grid3x3, Pencil, Users } from "lucide-react";
import type { Route } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChannelBadge, ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "./status-badge";
import { RouteMapPreview } from "./route-map-preview";
import { getSubcanal } from "@/data/channels";
import { formatDate } from "@/lib/utils";

interface RouteDetailSheetProps {
  route: Route | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouteDetailSheet({ route, open, onOpenChange }: RouteDetailSheetProps) {
  const navigate = useNavigate();
  if (!route) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <div className="flex items-center gap-2">
            <ColorDot color={route.color} className="h-4 w-4" />
            <SheetTitle className="text-xl">{route.name}</SheetTitle>
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={route.status} />
            <span className="inline-flex items-center gap-1 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(route.startDate)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" /> {route.clientCount} clientes
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Grid3x3 className="h-3.5 w-3.5" /> {route.blockIds.length} manzanos
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-6">
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Canales de venta
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {route.channelIds.map((id) => (
                <ChannelBadge key={id} channelId={id} />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subcanales
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {route.subcanalIds.map((id) => (
                <span
                  key={id}
                  className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium"
                >
                  {getSubcanal(id)?.name ?? id}
                </span>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cobertura
            </h4>
            <div className="h-64">
              <RouteMapPreview blockIds={route.blockIds} color={route.color} />
            </div>
          </section>

          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(`/routes/${route.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar ruta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
