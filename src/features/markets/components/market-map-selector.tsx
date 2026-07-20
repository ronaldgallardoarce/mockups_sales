import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, MousePointerClick, Pencil, Plus, X } from "lucide-react";
import type { LatLng } from "@/types";
import { Button } from "@/components/ui/button";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { DrawPolygonControl, type DrawHandle } from "@/features/map/components/draw-polygon-control";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClients } from "@/hooks/use-clients";
import { pointInPolygon } from "@/lib/geo";

type DrawMode = "idle" | "drawing" | "draft";

interface MarketMapSelectorProps {
  /** Selected manzano (block) ids that compose the market. */
  value: string[];
  onToggle: (blockId: string) => void;
  /** Whether the user can draw new manzanos (administrators only). */
  canDraw?: boolean;
}

/**
 * Interactive map for composing a market: pick existing manzanos over the
 * clients, or (admins) draw new ones. Markets have no channels, so every client
 * is plotted for reference.
 */
export function MarketMapSelector({ value, onToggle, canDraw = false }: MarketMapSelectorProps) {
  const blocks = useBlocksStore((s) => s.blocks);
  const addBlock = useBlocksStore((s) => s.addBlock);
  const { data: clients = [] } = useClients();
  const [drawMode, setDrawMode] = useState<DrawMode>("idle");
  const drawRef = useRef<DrawHandle>(null);

  const selectedBlocks = useMemo(() => blocks.filter((b) => value.includes(b.id)), [blocks, value]);

  const clientsInMarket = useMemo(
    () => clients.filter((c) => selectedBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))),
    [clients, selectedBlocks],
  );

  const fitPoints = useMemo<LatLng[]>(() => clients.map((c) => [c.lat, c.lng] as LatLng), [clients]);

  const handleSaveDraft = () => {
    const coords = drawRef.current?.save() ?? null;
    setDrawMode("idle");
    if (coords && coords.length >= 3) {
      addBlock({ polygon: coords });
      toast.success("Manzano guardado", { description: "Haz clic sobre él para agregarlo al mercado." });
    }
  };

  const handleCancelDraft = () => {
    drawRef.current?.cancel();
    setDrawMode("idle");
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted">
      <BaseMap layerControl>
        <BlockPolygons blocks={blocks} selectedIds={value} onSelect={(b) => onToggle(b.id)} />
        <ClientMarkers clients={clients} />
        <FitBounds points={fitPoints} />
        {canDraw && (
          <DrawPolygonControl
            ref={drawRef}
            active={drawMode === "drawing"}
            onDraftCreated={() => setDrawMode("draft")}
          />
        )}
      </BaseMap>

      {canDraw && (
        <div className="absolute bottom-3 left-3 z-[400] flex gap-2">
          {drawMode === "idle" && (
            <Button type="button" size="sm" variant="secondary" onClick={() => setDrawMode("drawing")} className="shadow-md">
              <Plus className="h-4 w-4" /> Crear manzano
            </Button>
          )}
          {drawMode === "drawing" && (
            <Button type="button" size="sm" variant="destructive" onClick={() => setDrawMode("idle")} className="shadow-md">
              <X className="h-4 w-4" /> Cancelar
            </Button>
          )}
          {drawMode === "draft" && (
            <>
              <Button type="button" size="sm" onClick={handleSaveDraft} className="shadow-md">
                <Check className="h-4 w-4" /> Guardar manzano
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleCancelDraft} className="shadow-md">
                <X className="h-4 w-4" /> Descartar
              </Button>
            </>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border bg-background/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
        {drawMode === "drawing" ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" /> Haz clic para los vértices y doble clic para cerrar
          </span>
        ) : drawMode === "draft" ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" /> Ajusta los vértices y confirma con “Guardar manzano”
          </span>
        ) : value.length === 0 ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MousePointerClick className="h-3.5 w-3.5" /> Haz clic en los manzanos del mercado
          </span>
        ) : (
          <span className="font-medium">
            {value.length} {value.length === 1 ? "manzano" : "manzanos"} ·{" "}
            <span className="text-muted-foreground">{clientsInMarket.length} clientes</span>
          </span>
        )}
      </div>
    </div>
  );
}
