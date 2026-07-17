import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Grid3x3,
  PencilRuler,
  // RotateCcw, // (Restablecer deshabilitado por el momento)
  Scissors,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { LatLng } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BaseMap } from "../components/base-map";
import { BlocksEditor } from "../components/blocks-editor";
import { ClientMarkers } from "../components/client-markers";
import { BlockClientsSheet } from "../components/block-clients-sheet";
import { GridSubdivideDialog } from "../components/grid-subdivide-dialog";
import { useBlocksStore } from "@/stores/blocks-store";
import { useClients } from "@/hooks/use-clients";
import {
  countPointsInPolygon,
  pointInPolygon,
  polygonsOverlap,
  splitPolygonByLine,
} from "@/lib/geo";

export function ManageMapPage() {
  const { blocks, addBlock, addBlocks, updateBlock, removeBlock, resetBlocks } = useBlocksStore();
  const { data: clients = [] } = useClients();

  /**
   * How clients are shown on the map. A single 3-state control (instead of a
   * boolean toggle plus a conditional filter switch) keeps the header stable —
   * no controls appear/disappear as the user changes their mind.
   */
  const [clientView, setClientView] = useState<"hidden" | "all" | "outside">("hidden");
  const showClients = clientView !== "hidden";
  const onlyOutsideBlocks = clientView === "outside";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editShapeId, setEditShapeId] = useState<string | null>(null);
  const [clientsSheetOpen, setClientsSheetOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [subdivideOpen, setSubdivideOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  /** "Guided cut" tool: active only for the currently selected block. */
  const [cutMode, setCutMode] = useState(false);
  const [cutAxis, setCutAxis] = useState<"lat" | "lng">("lat");
  /** Whether dragging a shared vertex during shape editing also moves every
   *  other block that shares it (default) or only the block being edited. */
  const [linkVertices, setLinkVertices] = useState(true);
  /** Polygon just drawn on the map, awaiting the user's confirmation to persist it. */
  const [pendingPolygon, setPendingPolygon] = useState<LatLng[] | null>(null);
  /**
   * When on, drawn manzanos are saved directly (no confirm dialog) and the draw
   * tool stays armed to chain one after another. When off, each drawing opens
   * the confirmation dialog before persisting.
   */
  const [autoSave, setAutoSave] = useState(false);

  // Only one floating panel/dialog should be interactive at a time: whenever any
  // Dialog/Sheet/ConfirmDialog is open, the absolutely-positioned selected-block
  // panel (z-[400]) must yield instead of visually stacking on top of it.
  const modalOpen =
    clientsSheetOpen || subdivideOpen || !!toDelete || confirmReset || !!pendingPolygon;

  // Cut mode's guide line isn't a Dialog/Sheet, so it doesn't gate on
  // `modalOpen` above — but it should still get out of the way whenever an
  // actual modal opens on top of it.
  useEffect(() => {
    if (modalOpen) setCutMode(false);
  }, [modalOpen]);

  const clientPoints = useMemo<LatLng[]>(() => clients.map((c) => [c.lat, c.lng]), [clients]);

  // Clients that don't fall inside any block polygon. Computed once so both the
  // "Sin manzano" counter and the filtered map share a single source of truth.
  const outsideClients = useMemo(
    () => clients.filter((c) => !blocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))),
    [clients, blocks],
  );

  // Clients rendered on the map for the current view.
  const visibleClients = onlyOutsideBlocks ? outsideClients : clients;

  // Clients inside each block (purely by location, any channel).
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of blocks) m.set(b.id, countPointsInPolygon(clientPoints, b.polygon));
    return m;
  }, [blocks, clientPoints]);

  // Highlight every block that overlaps at least one other.
  const warnIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (polygonsOverlap(blocks[i].polygon, blocks[j].polygon)) {
          ids.add(blocks[i].id);
          ids.add(blocks[j].id);
        }
      }
    }
    return [...ids];
  }, [blocks]);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const selectedCount = selected ? counts.get(selected.id) ?? 0 : 0;
  const clientsInSelected = useMemo(
    () => (selected ? clients.filter((c) => pointInPolygon([c.lat, c.lng], selected.polygon)) : []),
    [selected, clients],
  );

  // Clears every per-block floating panel/dialog — used both when deselecting
  // and when a new block is selected, so a stale panel/sheet from the
  // previously selected block never stays open behind the new one.
  const deselect = () => {
    setSelectedId(null);
    setEditShapeId(null);
    setClientsSheetOpen(false);
    setSubdivideOpen(false);
    setToDelete(null);
    setCutMode(false);
    setLinkVertices(true);
  };

  const selectBlock = (id: string) => {
    setSelectedId(id);
    setEditShapeId(null);
    setClientsSheetOpen(false);
    setSubdivideOpen(false);
    setToDelete(null);
    setCutMode(false);
    setLinkVertices(true);
  };

  const pendingInside = useMemo(
    () => (pendingPolygon ? countPointsInPolygon(clientPoints, pendingPolygon) : 0),
    [pendingPolygon, clientPoints],
  );

  /** Persist a drawn polygon and toast its client count / overlap warning. */
  const persistBlock = (polygon: LatLng[], select: boolean) => {
    const inside = countPointsInPolygon(clientPoints, polygon);
    const block = addBlock({ polygon });
    const overlaps = useBlocksStore.getState().findOverlaps(polygon, block.id).length > 0;
    toast.success("Manzano creado", {
      description: `${inside} ${inside === 1 ? "cliente" : "clientes"} dentro${
        overlaps ? " · ⚠️ se solapa con otro manzano" : ""
      }`,
    });
    // In auto-save mode we skip selection so the floating panel doesn't pop up
    // and interrupt the continuous drawing flow.
    if (select) selectBlock(block.id);
    return block;
  };

  // Leaflet-Geoman already removes the just-drawn temporary layer as soon as
  // `pm:create` fires (see blocks-editor.tsx), regardless of what happens
  // next — so holding the polygon in state here and only persisting it via
  // `addBlock` on confirmation is enough to make cancel a true no-op.
  const handleCreate = (polygon: LatLng[]) => {
    if (autoSave) {
      persistBlock(polygon, false);
    } else {
      setPendingPolygon(polygon);
    }
  };

  const confirmCreate = () => {
    if (!pendingPolygon) return;
    persistBlock(pendingPolygon, true);
    setPendingPolygon(null);
  };

  const cancelCreate = () => setPendingPolygon(null);

  const handleSubdivide = (cells: LatLng[][]) => {
    if (!selected || cells.length === 0) return;
    removeBlock(selected.id);
    addBlocks(cells.map((polygon) => ({ polygon })));
    toast.success("Manzano subdividido", {
      description: `${cells.length} ${cells.length === 1 ? "manzano creado" : "manzanos creados"}`,
    });
    setSubdivideOpen(false);
    deselect();
  };

  const handleCutConfirm = (axis: "lat" | "lng", value: number) => {
    if (!selected) return;
    const sides = splitPolygonByLine(selected.polygon, axis, value).filter(
      (p) => p.length >= 3,
    );
    // The cut line missed the block (both sides empty/sliver) — keep cut mode
    // active so the user can just try again without re-opening the tool.
    if (sides.length === 0) return;
    removeBlock(selected.id);
    addBlocks(sides.map((polygon) => ({ polygon })));
    toast.success("Manzano cortado", {
      description: `${sides.length} ${sides.length === 1 ? "manzano creado" : "manzanos creados"}`,
    });
    setCutMode(false);
    deselect();
  };

  return (
    <>
      <PageHeader
        title="Gestionar Mapa"
        description="Dibuja manzanos (sectores) para ubicar clientes por zona. Dibuja un manzano grande y subdivídelo en una grilla de manzanos más pequeños, o crea cada uno por separado."
      >
        <div className="flex h-9 items-center gap-2.5 rounded-md border px-3">
          <Label
            htmlFor="toggle-autosave"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-normal"
          >
            <Zap className={`h-3.5 w-3.5 ${autoSave ? "text-amber-500" : "text-muted-foreground"}`} />
            Guardado automático
          </Label>
          <Switch id="toggle-autosave" checked={autoSave} onCheckedChange={setAutoSave} />
        </div>
        <div className="flex h-9 shrink-0 items-center gap-2 rounded-md border pl-3 pr-1">
          <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">
            Clientes
          </span>
          <div className="flex h-7 items-center gap-0.5 rounded-md bg-muted p-0.5">
            {(
              [
                { value: "hidden", label: "Ocultar" },
                { value: "all", label: "Todos" },
                { value: "outside", label: `Sin manzano (${outsideClients.length})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setClientView(opt.value)}
                aria-pressed={clientView === opt.value}
                className={`flex h-full items-center whitespace-nowrap rounded-sm px-2.5 text-xs font-medium leading-none transition-colors ${
                  clientView === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Restablecer deshabilitado por el momento.
        <Button variant="outline" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" /> Restablecer
        </Button>
        */}
      </PageHeader>

      {warnIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Hay {warnIds.length} manzano(s) solapados (marcados en rojo). Revisa la cobertura para
            evitar zonas duplicadas.
          </span>
        </div>
      )}

      <div className="relative h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-xl border">
        <BaseMap layerControl>
          <BlocksEditor
            blocks={blocks}
            counts={counts}
            showCounts={!showClients}
            selectedId={selectedId}
            editShapeId={editShapeId}
            warnIds={warnIds}
            cutMode={cutMode}
            cutAxis={cutAxis}
            linkVertices={linkVertices}
            autoSave={autoSave}
            onCreate={handleCreate}
            onUpdateGeometry={(id, polygon) => updateBlock(id, { polygon })}
            onSelect={selectBlock}
            onCutConfirm={handleCutConfirm}
            onCutCancel={() => setCutMode(false)}
          />
          {showClients && <ClientMarkers clients={visibleClients} />}
        </BaseMap>

        {/* Selected-block panel (edit shape / delete). Hidden while any
            Dialog/Sheet/ConfirmDialog is open so it never stacks on top of it. */}
        {selected && !modalOpen && (
          <div className="absolute left-1/2 top-3 z-[400] w-72 -translate-x-1/2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Manzano</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {counts.get(selected.id) ?? 0} clientes en esta zona
                </p>
              </div>
              <button
                onClick={deselect}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cutMode ? (
              <div className="mt-3 space-y-2">
                <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                  Mueve el cursor sobre el mapa y haz clic para cortar el manzano. Presiona Esc
                  para cancelar.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={cutAxis === "lat" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCutAxis("lat")}
                  >
                    Horizontal
                  </Button>
                  <Button
                    size="sm"
                    variant={cutAxis === "lng" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCutAxis("lng")}
                  >
                    Vertical
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCutMode(false)}
                >
                  Cancelar corte
                </Button>
              </div>
            ) : editShapeId === selected.id ? (
              <div className="mt-3 space-y-2">
                <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                  Arrastra los vértices o el manzano para ajustar la forma.
                </p>
                <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                  <Label htmlFor="toggle-link-vertices" className="cursor-pointer text-xs font-normal">
                    {linkVertices
                      ? "Vincular vértices vecinos"
                      : "Editar vértice independiente"}
                  </Label>
                  <Switch
                    id="toggle-link-vertices"
                    checked={linkVertices}
                    onCheckedChange={setLinkVertices}
                  />
                </div>
                <Button size="sm" className="w-full" onClick={() => setEditShapeId(null)}>
                  Listo
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedCount > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setClientsSheetOpen(true)}
                  >
                    <Users className="h-4 w-4" /> Ver {selectedCount}{" "}
                    {selectedCount === 1 ? "cliente" : "clientes"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setSubdivideOpen(true)}
                >
                  <Grid3x3 className="h-4 w-4" /> Subdividir en grilla
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setCutMode(true)}
                >
                  <Scissors className="h-4 w-4" /> Cortar manzano
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditShapeId(selected.id)}
                  >
                    <PencilRuler className="h-4 w-4" /> Editar forma
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setToDelete(selected.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BlockClientsSheet
        open={clientsSheetOpen && !!selected}
        onOpenChange={setClientsSheetOpen}
        blockId={selected?.id ?? ""}
        clients={clientsInSelected}
      />

      <GridSubdivideDialog
        open={subdivideOpen && !!selected}
        onOpenChange={setSubdivideOpen}
        polygon={selected?.polygon ?? null}
        onConfirm={handleSubdivide}
      />

      <ConfirmDialog
        open={!!pendingPolygon}
        onOpenChange={(o) => !o && cancelCreate()}
        title="¿Guardar este manzano?"
        description={`Se creará un nuevo manzano con ${pendingInside} ${
          pendingInside === 1 ? "cliente" : "clientes"
        } dentro. Puedes cancelar para descartar el dibujo.`}
        confirmLabel="Guardar"
        cancelLabel="Descartar"
        onConfirm={confirmCreate}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="¿Eliminar manzano?"
        description="Se eliminará este sector del mapa. Los clientes no se ven afectados."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (toDelete) {
            removeBlock(toDelete);
            toast.success("Manzano eliminado");
            if (selectedId === toDelete) deselect();
            setToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="¿Restablecer manzanos?"
        description="Se descartarán los cambios recientes y los manzanos volverán a su última configuración guardada. Esta acción no se puede deshacer."
        confirmLabel="Restablecer"
        destructive
        onConfirm={() => {
          resetBlocks();
          deselect();
          toast.success("Manzanos restablecidos");
          setConfirmReset(false);
        }}
      />
    </>
  );
}
