import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, PencilRuler, RotateCcw, Trash2, Users, X } from "lucide-react";
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
import { useBlocksStore } from "@/stores/blocks-store";
import { useClients } from "@/hooks/use-clients";
import { countPointsInPolygon, pointInPolygon, polygonsOverlap } from "@/lib/geo";

export function ManageMapPage() {
  const { blocks, addBlock, updateBlock, removeBlock, resetBlocks } = useBlocksStore();
  const { data: clients = [] } = useClients();

  const [showClients, setShowClients] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editShapeId, setEditShapeId] = useState<string | null>(null);
  const [clientsSheetOpen, setClientsSheetOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const clientPoints = useMemo<LatLng[]>(() => clients.map((c) => [c.lat, c.lng]), [clients]);

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

  const deselect = () => {
    setSelectedId(null);
    setEditShapeId(null);
    setClientsSheetOpen(false);
  };

  const handleCreate = (polygon: LatLng[]) => {
    const inside = countPointsInPolygon(clientPoints, polygon);
    const block = addBlock({ polygon });
    const overlaps = useBlocksStore.getState().findOverlaps(polygon, block.id).length > 0;
    toast.success("Polígono creado", {
      description: `${inside} ${inside === 1 ? "cliente" : "clientes"} dentro${
        overlaps ? " · ⚠️ se solapa con otro polígono" : ""
      }`,
    });
    setSelectedId(block.id);
  };

  return (
    <>
      <PageHeader
        title="Gestionar Mapa"
        description="Dibuja manzanos (sectores) para ubicar clientes por zona. Cada manzano muestra cuántos clientes contiene según su ubicación."
      >
        <div className="flex h-9 items-center gap-2.5 rounded-md border px-3">
          <Label htmlFor="toggle-clients" className="cursor-pointer text-xs font-normal">
            Mostrar clientes
          </Label>
          <Switch id="toggle-clients" checked={showClients} onCheckedChange={setShowClients} />
        </div>
        <Button variant="outline" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" /> Restablecer
        </Button>
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
            selectedId={selectedId}
            editShapeId={editShapeId}
            warnIds={warnIds}
            onCreate={handleCreate}
            onUpdateGeometry={(id, polygon) => updateBlock(id, { polygon })}
            onSelect={(id) => {
              setSelectedId(id);
              setEditShapeId(null);
            }}
          />
          {showClients && <ClientMarkers clients={clients} />}
        </BaseMap>

        {/* Selected-block panel (edit shape / delete) */}
        {selected && (
          <div className="absolute left-1/2 top-3 z-[400] w-72 -translate-x-1/2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Polígono</p>
                <p className="font-mono text-[11px] text-muted-foreground">{selected.id}</p>
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

            {editShapeId === selected.id ? (
              <div className="mt-3 space-y-2">
                <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                  Arrastra los vértices o el manzano para ajustar la forma.
                </p>
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
