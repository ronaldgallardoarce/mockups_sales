import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, MousePointerClick, Pencil, Plus, X } from "lucide-react";
import type { Client, LatLng } from "@/types";
import { Button } from "@/components/ui/button";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { FlyToClient } from "@/features/map/components/fly-to-client";
import { DrawPolygonControl, type DrawHandle } from "@/features/map/components/draw-polygon-control";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

type DrawMode = "idle" | "drawing" | "draft";

interface RouteMapSelectorProps {
  /** Selected polygon (manzano) ids that compose the route. */
  value: string[];
  onToggle: (blockId: string) => void;
  /** Drives which clients are shown (clients of these subcanales/channels). */
  subcanalIds: string[];
  /** Client to fly to and highlight on the map. */
  focusClient?: Client | null;
  /** Per-block override colors (e.g. manzanos from an assigned market). */
  blockColors?: Record<string, string>;
}

/**
 * Interactive map for composing a route. Channel clients are plotted so the
 * user can see WHERE they cluster and pick the polygons over them. If a client
 * sits outside every polygon, the user can draw a new one here (it's saved and
 * can then be optionally added to the route). Zoom stays fixed while selecting.
 */
export function RouteMapSelector({ value, onToggle, subcanalIds, focusClient, blockColors }: RouteMapSelectorProps) {
  const blocks = useBlocksStore((s) => s.blocks);
  const addBlock = useBlocksStore((s) => s.addBlock);
  const { data: clients = [], isFetching } = useClientsBySubcanales(subcanalIds);
  const [drawMode, setDrawMode] = useState<DrawMode>("idle");
  const drawRef = useRef<DrawHandle>(null);

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

  const handleSaveDraft = () => {
    const coords = drawRef.current?.save() ?? null;
    setDrawMode("idle");
    if (coords && coords.length >= 3) {
      addBlock({ polygon: coords });
      toast.success("Polígono guardado", {
        description: "Haz clic sobre él para agregarlo a la ruta.",
      });
    }
  };

  const handleCancelDraft = () => {
    drawRef.current?.cancel();
    setDrawMode("idle");
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        <BlockPolygons blocks={blocks} selectedIds={value} onSelect={(b) => onToggle(b.id)} blockColors={blockColors} />
        {!noChannels && <ClientMarkers clients={clients} highlightedClientId={focusClient?.id} />}
        <FitBounds points={fitPoints} />
        <FlyToClient client={focusClient} />
        <DrawPolygonControl
          ref={drawRef}
          active={drawMode === "drawing"}
          onDraftCreated={() => setDrawMode("draft")}
        />
      </BaseMap>

      {/* Draw controls */}
      <div className="absolute bottom-3 left-3 z-[400] flex gap-2">
        {drawMode === "idle" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDrawMode("drawing")}
            className="shadow-md"
          >
            <Plus className="h-4 w-4" /> Crear polígono
          </Button>
        )}
        {drawMode === "drawing" && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => setDrawMode("idle")}
            className="shadow-md"
          >
            <X className="h-4 w-4" /> Cancelar
          </Button>
        )}
        {drawMode === "draft" && (
          <>
            <Button type="button" size="sm" onClick={handleSaveDraft} className="shadow-md">
              <Check className="h-4 w-4" /> Guardar polígono
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelDraft}
              className="shadow-md"
            >
              <X className="h-4 w-4" /> Descartar
            </Button>
          </>
        )}
      </div>

      {/* Hint / counter */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border bg-background/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
        {drawMode === "drawing" ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Haz clic para los vértices y doble clic para cerrar el polígono
          </span>
        ) : drawMode === "draft" ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Ajusta los vértices y confirma con “Guardar polígono”
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
