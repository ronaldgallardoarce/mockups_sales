import { useMemo } from "react";
import { Check, UserCheck, X } from "lucide-react";
import type { Client, Seller } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel, getSubcanal } from "@/data/channels";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SellerReassignPanelProps {
  /** Client being excluded and awaiting a replacement seller. */
  client: Client;
  sellers: Seller[];
  /** Seller code already chosen, if the client was reassigned before. */
  value?: number;
  onSelect: (sellerCode: number) => void;
  onCancel: () => void;
}

/**
 * In-place reassignment panel: shows the client card on top and a searchable
 * seller list below. Replaces the "No asignados" column while a client is being
 * excluded, so choosing who attends it happens without leaving the manager.
 */
export function SellerReassignPanel({ client, sellers, value, onSelect, onCancel }: SellerReassignPanelProps) {
  const channel = getChannel(client.channelId);

  const sorted = useMemo(
    () =>
      [...sellers].sort((a, b) => {
        if (a.status !== b.status) return a.status === "ACTIVO" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [sellers],
  );

  return (
    <div className="flex min-h-0 flex-col rounded-xl border bg-card ring-2 ring-primary/20">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <UserCheck className="h-3.5 w-3.5" /> Reasignar cliente
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>

      <div className="border-b p-2.5">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: channel?.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{client.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              <span className="font-mono">{client.code}</span> · {channel?.name} ·{" "}
              {getSubcanal(client.subcanalId)?.name}
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Elegí qué vendedor atenderá a este cliente.
        </p>
      </div>

      <Command className="min-h-0 flex-1">
        <CommandInput placeholder="Buscar vendedor…" />
        <CommandList className="flex-1">
          <CommandEmpty>Sin vendedores disponibles.</CommandEmpty>
          <CommandGroup>
            {sorted.map((s) => (
              <CommandItem
                key={s.code}
                value={`${s.name} ${s.code}`}
                onSelect={() => onSelect(s.code)}
                className="gap-2"
              >
                <Check
                  className={cn("h-4 w-4 shrink-0", s.code === value ? "opacity-100" : "opacity-0")}
                />
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    s.status === "ACTIVO" ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                  title={s.status === "ACTIVO" ? "Activo" : "Inactivo"}
                />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">V-{s.code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
