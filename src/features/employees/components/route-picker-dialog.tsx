import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Route } from "@/types";
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
import { StatusBadge } from "@/features/routes/components/status-badge";

interface RoutePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routes not yet assigned to this employee. */
  candidates: Route[];
  onPick: (route: Route) => void;
}

/** Searchable route picker — clicking a row assigns it and keeps the dialog open. */
export function RoutePickerDialog({ open, onOpenChange, candidates, onPick }: RoutePickerDialogProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = candidates.filter((r) => !q || r.name.toLowerCase().includes(q));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar ruta</DialogTitle>
          <DialogDescription>Selecciona una ruta para agregarla a este empleado.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ruta…"
            className="pl-9"
          />
        </div>

        <div className="-mx-2 max-h-80 overflow-y-auto px-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {candidates.length === 0 ? "Ya asignaste todas las rutas disponibles." : "Sin coincidencias."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((route) => (
                <li key={route.id}>
                  <button
                    type="button"
                    onClick={() => onPick(route)}
                    className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <ColorDot color={route.color} />
                    <span className="min-w-0 flex-1 truncate font-medium">{route.name}</span>
                    <StatusBadge status={route.status} />
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
