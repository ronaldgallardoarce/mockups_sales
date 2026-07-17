import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Grid3x3, Pencil, Route as RouteIcon } from "lucide-react";
import type { Route, RouteMacro } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { useRoutes } from "@/hooks/use-routes";
import { MacroRoutesMap } from "./macro-routes-map";

interface RouteMacroDetailSheetProps {
  macro: RouteMacro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouteMacroDetailSheet({ macro, open, onOpenChange }: RouteMacroDetailSheetProps) {
  const navigate = useNavigate();
  const { data: allRoutes = [] } = useRoutes();

  const routes = useMemo<Route[]>(() => {
    if (!macro) return [];
    const byId = new Map(allRoutes.map((r) => [r.id, r]));
    return macro.routeIds.map((id) => byId.get(id)).filter((r): r is Route => !!r);
  }, [macro, allRoutes]);

  const blockCount = useMemo(() => {
    const blocks = new Set<string>();
    routes.forEach((r) => r.blockIds.forEach((b) => blocks.add(b)));
    return blocks.size;
  }, [routes]);

  if (!macro) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="space-y-2 border-b p-6 text-left">
          <SheetTitle className="text-xl">{macro.name}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={macro.status} />
            <span className="inline-flex items-center gap-1 text-xs">
              <RouteIcon className="h-3.5 w-3.5" /> {macro.routeIds.length} rutas
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Grid3x3 className="h-3.5 w-3.5" /> {blockCount} manzanos
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-6">
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rutas incluidas
            </h4>
            <div className="space-y-1.5">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <ColorDot color={route.color} className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">{route.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Grid3x3 className="h-3 w-3" /> {route.blockIds.length}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cobertura en mapa
            </h4>
            <div className="h-64">
              <MacroRoutesMap routes={routes} />
            </div>
          </section>

          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(`/route-macros/${macro.id}/edit`);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar macroruta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
