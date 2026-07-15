import { useEffect, useMemo, useState } from "react";
import { Grid3x3, Minus, Plus } from "lucide-react";
import type { Polygon } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { subdivideIntoGrid } from "@/lib/geo";

const MIN = 1;
const MAX = 12;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

interface GridSubdivideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Polygon to subdivide (the currently selected block). */
  polygon: Polygon | null;
  /** Receives the generated grid cells when the user confirms. */
  onConfirm: (cells: Polygon[]) => void;
}

/** Number stepper with – / + buttons. */
function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= MIN}
          aria-label={`Menos ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="flex h-9 w-12 items-center justify-center rounded-md border text-sm font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= MAX}
          aria-label={`Más ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GridSubdivideDialog({
  open,
  onOpenChange,
  polygon,
  onConfirm,
}: GridSubdivideDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // Reset to a sensible default each time the dialog opens.
  useEffect(() => {
    if (open) {
      setRows(3);
      setCols(3);
    }
  }, [open]);

  // Actual (clipped) cell count — boundary cells may be fewer than rows×cols.
  const cells = useMemo(
    () => (polygon ? subdivideIntoGrid(polygon, rows, cols) : []),
    [polygon, rows, cols],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" /> Subdividir en grilla
          </DialogTitle>
          <DialogDescription>
            El polígono se dividirá en una grilla. Cada celda se convierte en un manzano
            independiente, recortado al borde para que no queden espacios vacíos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <Stepper label="Filas" value={rows} onChange={setRows} />
          <span className="pb-2 text-muted-foreground">×</span>
          <Stepper label="Columnas" value={cols} onChange={setCols} />
        </div>

        <p className="rounded-md bg-muted px-3 py-2 text-center text-sm">
          Se crearán{" "}
          <span className="font-semibold text-foreground">{cells.length}</span>{" "}
          {cells.length === 1 ? "manzano" : "manzanos"}
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => onConfirm(cells)} disabled={cells.length === 0}>
            Subdividir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
