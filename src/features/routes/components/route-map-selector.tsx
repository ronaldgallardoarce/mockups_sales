import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, MousePointerClick, Pencil, Plus, X } from "lucide-react";
import type { LatLng } from "@/types";
import { Button } from "@/components/ui/button";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { DrawPolygonControl } from "@/features/map/components/draw-polygon-control";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

interface RouteMapSelectorProps {
  /** Selected polygon (manzano) ids that compose the route. */
  value: string[];
  onToggle: (blockId: string) => void;
  /** Drives which clients are shown (clients of these subcanales/channels). */
  subcanalIds: string[];
}

/**
 * Interactive map for composing a route. Channel clients are plotted so the
 * user can see WHERE they cluster and pick the polygons over them. If a client
 * sits outside every polygon, the user can draw a new one here (it's saved and
 * can then be optionally added to the route). Zoom stays fixed while selecting.
 */
export function RouteMapSelector({ value, onToggle, subcanalIds }: RouteMapSelectorProps) {
  const blocks = useBlocksStore((s) => s.blocks);
  const addBlock = useBlocksStore((s) => s.addBlock);
  const { data: clients = [], isFetching } = useClientsBySubcanales(subcanalIds);
  const [drawing, setDrawing] = useState(false);

  const selectedBlocks = useMemo(
    () => blocks.filter((b) => value.includes(b.id)),
    [blocks, value],
  );

  const clientsInRoute = useMemo(
    () => clients.filter((c) => selectedBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))),
    [clients, selectedBlocks],
  );

  // Fit depends ONLY on the (channel) clients — not on the selection nor on the
  // blocks list — so the zoom stays put while selecting or drawing polygons.
  // It only re-fits when the channel/client set changes.
  const fitPoints = useMemo<LatLng[]>(
    () => clients.map((c) => [c.lat, c.lng] as LatLng),
    [clients],
  );

  const noChannels = subcanalIds.length === 0;

  const handleCreated = (polygon: LatLng[]) => {
    addBlock({ polygon });
    setDrawing(false);
    toast.success("Polígono creado", {
      description: "Haz clic sobre él para agregarlo a la ruta.",
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        <BlockPolygons blocks={blocks} selectedIds={value} onSelect={(b) => onToggle(b.id)} />
        {!noChannels && <ClientMarkers clients={clients} />}
        <FitBounds points={fitPoints} />
        <DrawPolygonControl active={drawing} onCreated={handleCreated} />
      </BaseMap>

      {/* Draw toggle */}
      <div className="absolute bottom-3 left-3 z-[400]">
        <Button
          type="button"
          size="sm"
          variant={drawing ? "destructive" : "secondary"}
          onClick={() => setDrawing((d) => !d)}
          className="shadow-md"
        >
          {drawing ? (
            <>
              <X className="h-4 w-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Crear polígono
            </>
          )}
        </Button>
      </div>

      {/* Hint / counter */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border bg-background/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
        {drawing ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Haz clic para los vértices y doble clic para cerrar el polígono
          </span>
        ) : noChannels ? (
          <span className="text-muted-foreground">
            Selecciona un canal para ver sus clientes en el mapa
          </span>
        ) : value.length === 0 ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MousePointerClick className="h-3.5 w-3.5" />
            Haz clic en los polígonos donde están tus clientes
          </span>
        ) : (
          <span className="font-medium">
            {value.length} {value.length === 1 ? "polígono" : "polígonos"} ·{" "}
            <span className="text-muted-foreground">{clientsInRoute.length} clientes en ruta</span>
          </span>
        )}
      </div>

      {!noChannels && isFetching && (
        <div className="absolute right-3 top-3 z-[400] flex items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando clientes…
        </div>
      )}
    </div>
  );
}
