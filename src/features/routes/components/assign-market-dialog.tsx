import { useEffect, useMemo, useState } from "react";
import { Check, Search, Store, Users } from "lucide-react";
import type { Client } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorDot } from "@/components/common/channel-badge";
import { useMarkets } from "@/hooks/use-markets";
import { useClients } from "@/hooks/use-clients";
import { useBlocksStore } from "@/stores/blocks-store";
import { pointInPolygon } from "@/lib/geo";

interface AssignMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Markets already assigned to the route (pre-checked on open). */
  assignedMarketIds: string[];
  /** Apply the checked markets as the route's assigned markets (adds + removes). */
  onConfirm: (marketIds: string[]) => void;
}

/**
 * Picks one or more markets to visit on a traditional-channel route. Selecting a
 * market previews its manzanos and clients; confirming assigns them to the route.
 */
export function AssignMarketDialog({ open, onOpenChange, assignedMarketIds, onConfirm }: AssignMarketDialogProps) {
  const { data: markets = [] } = useMarkets();
  const { data: clients = [] } = useClients();
  const blocks = useBlocksStore((s) => s.blocks);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // On open, reflect the markets already assigned to the route (stay checked).
  useEffect(() => {
    if (open) {
      setSelected(new Set(assignedMarketIds));
      setSearch("");
    }
    // Only re-sync when the dialog opens, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Per-market clients that fall inside its manzanos.
  const clientsByMarket = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const m of markets) {
      const polys = blocks.filter((b) => m.blockIds.includes(b.id));
      map.set(m.id, clients.filter((c) => polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon))));
    }
    return map;
  }, [markets, blocks, clients]);

  const q = search.trim().toLowerCase();
  const filtered = markets.filter((m) => !q || m.name.toLowerCase().includes(q));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm([...selected]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar mercado</DialogTitle>
          <DialogDescription>
            Selecciona los mercados que se visitarán en esta ruta. Se agregarán sus manzanos y clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mercado…"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 max-h-[52vh] space-y-1.5 overflow-y-auto px-1">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {markets.length === 0 ? "Todavía no hay mercados creados." : "Sin coincidencias."}
            </p>
          ) : (
            filtered.map((market) => {
              const marketClients = clientsByMarket.get(market.id) ?? [];
              const isSelected = selected.has(market.id);
              const previewClients = marketClients.slice(0, 4);
              const restClients = marketClients.length - previewClients.length;

              return (
                <div
                  key={market.id}
                  className={cn(
                    "rounded-lg border transition-colors",
                    isSelected ? "border-primary/50 bg-primary/5" : "hover:border-primary/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(market.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <ColorDot color={market.color} className="h-3.5 w-3.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{market.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{market.provinceName ?? "—"}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{market.blockIds.length} manzanos</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {marketClients.length}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isSelected && marketClients.length > 0 && (
                    <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
                      Clientes: {previewClients.map((c) => c.name).join(", ")}
                      {restClients > 0 && ` +${restClients} más`}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <span className="flex items-center gap-1.5 self-center text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            {selected.size} mercado(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
