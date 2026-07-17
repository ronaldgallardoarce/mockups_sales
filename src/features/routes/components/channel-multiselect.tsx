import { useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import type { Channel } from "@/types";
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
import { getSubcanalesByChannel } from "@/data/channels";

interface ChannelMultiSelectProps {
  channels: Channel[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
}

export function ChannelMultiSelect({ channels, value, onChange, loading }: ChannelMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const selected = channels.filter((c) => value.includes(c.id));
  const q = query.trim().toLowerCase();
  const filtered = channels.filter((c) => !q || c.name.toLowerCase().includes(q));

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
            {value.length} {value.length === 1 ? "canal seleccionado" : "canales seleccionados"}
          </span>
        ) : (
          <span>Selecciona canales…</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ch) => (
            <span
              key={ch.id}
              className="inline-flex items-center gap-1 rounded-md border bg-muted py-0.5 pl-1.5 pr-1 text-xs font-medium"
            >
              <ColorDot color={ch.color} className="h-2 w-2" />
              {ch.name}
              <button
                type="button"
                onClick={() => toggle(ch.id)}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label={`Quitar ${ch.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Canales de venta</DialogTitle>
            <DialogDescription>Selecciona los canales que atiende la ruta.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal…"
              className="pl-9"
            />
          </div>

          <div className="-mx-2 max-h-72 overflow-y-auto px-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin coincidencias.</p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((ch) => {
                  const isSel = value.includes(ch.id);
                  return (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => toggle(ch.id)}
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
                        <ColorDot color={ch.color} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{ch.name}</span>
                          {ch.description && (
                            <span className="hidden truncate text-xs text-muted-foreground sm:block">
                              {ch.description}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {getSubcanalesByChannel(ch.id).length} subcanales
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{value.length} seleccionados</span>
            <Button type="button" onClick={() => setOpen(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
