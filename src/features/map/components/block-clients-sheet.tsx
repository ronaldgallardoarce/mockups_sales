import { MapPin, Phone, Store, User } from "lucide-react";
import type { Client } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/empty-state";
import { ChannelBadge } from "@/components/common/channel-badge";
import { getSubcanal } from "@/data/channels";

interface BlockClientsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  clients: Client[];
}

/** Slide-over list of the clients located inside a polygon. */
export function BlockClientsSheet({ open, onOpenChange, blockId, clients }: BlockClientsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-1 border-b p-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </span>
            Clientes del manzano
          </SheetTitle>
          <SheetDescription>
            <span className="font-mono">{blockId}</span> ·{" "}
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"} en esta zona
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {clients.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Sin clientes"
              description="Este manzano no contiene clientes según su ubicación."
            />
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{client.code}</p>
                    </div>
                    <ChannelBadge channelId={client.channelId} />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" /> {client.ownerName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {client.address}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {client.phone}
                    </p>
                    <p className="pt-0.5 font-medium text-foreground/70">
                      {getSubcanal(client.subcanalId)?.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
