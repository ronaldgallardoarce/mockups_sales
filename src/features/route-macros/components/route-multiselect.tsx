import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Grid3x3, Search, X } from "lucide-react";
import type { Route, RouteStatus } from "@/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorDot } from "@/components/common/channel-badge";

interface RouteMultiSelectProps {
  routes: Route[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}

/** Dialog picker to add one or many routes to a macro. */
export function RouteMultiSelect({ routes, value, onChange, loading }: RouteMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RouteStatus | "all">("all");

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      routes.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (!q || r.name.toLowerCase().includes(q)),
      ),
    [routes, q, status],
  );

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => setOpen(true)}
        className="h-9 w-full justify-between px-3 font-normal text-muted-foreground"
      >
        {value.length > 0 ? (
          <span className="text-foreground">
            {value.length} {value.length === 1 ? "ruta seleccionada" : "rutas seleccionadas"}
          </span>
        ) : (
          <span>Selecciona rutas…</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rutas de la macroruta</DialogTitle>
            <DialogDescription>
              Selecciona una o varias rutas que compondrán la macroruta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ruta…"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as RouteStatus | "all")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="-mx-2 max-h-80 overflow-y-auto px-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin coincidencias.</p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((route) => {
                  const isSel = value.includes(route.id);
                  return (
                    <li key={route.id}>
                      <button
                        type="button"
                        onClick={() => toggle(route.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          isSel ? "border-primary/40 bg-primary/5" : "hover:bg-accent",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                            isSel
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {isSel && <Check className="h-3 w-3" />}
                        </span>
                        <ColorDot color={route.color} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{route.name}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Grid3x3 className="h-3 w-3" />
                          {route.blockIds.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{value.length} seleccionadas</span>
            <div className="flex gap-2">
              {value.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => onChange([])}>
                  <X className="h-4 w-4" /> Limpiar
                </Button>
              )}
              <Button type="button" onClick={() => setOpen(false)}>
                Listo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
