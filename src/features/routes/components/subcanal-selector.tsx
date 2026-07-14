import { useMemo, useState } from "react";
import { Check, Plus, Search, Users } from "lucide-react";
import type { Client } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { getChannel, getSubcanalesByChannel } from "@/data/channels";

interface SubcanalSelectorProps {
  channelIds: string[];
  value: string[];
  onChange: (ids: string[]) => void;
  clients: Client[];
}

/**
 * Subcanales grouped by channel with a search box, per-group "select all" and
 * a scrollable area so it scales when there are many. Each chip shows how many
 * mock clients belong to that subcanal.
 */
export function SubcanalSelector({ channelIds, value, onChange, clients }: SubcanalSelectorProps) {
  const [query, setQuery] = useState("");

  const countBySubcanal = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clients) m.set(c.subcanalId, (m.get(c.subcanalId) ?? 0) + 1);
    return m;
  }, [clients]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (channelIds.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Selecciona un canal de venta para ver sus subcanales.
      </p>
    );
  }

  const q = query.trim().toLowerCase();
  const groups = channelIds
    .map((chId) => {
      const channel = getChannel(chId);
      const subs = getSubcanalesByChannel(chId).filter((s) => !q || s.name.toLowerCase().includes(q));
      return { channel, subs };
    })
    .filter((g) => g.subs.length > 0);

  const selectedTotal = value.length;

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar subcanal…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <span className="shrink-0 pr-1 text-xs text-muted-foreground">{selectedTotal} sel.</span>
      </div>

      <div className="max-h-56 space-y-3 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin coincidencias.</p>
        ) : (
          groups.map(({ channel, subs }) => {
            const allSelected = subs.every((s) => value.includes(s.id));
            const toggleAll = () => {
              const ids = subs.map((s) => s.id);
              onChange(
                allSelected
                  ? value.filter((v) => !ids.includes(v))
                  : Array.from(new Set([...value, ...ids])),
              );
            };
            return (
              <div key={channel?.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channel?.color }} />
                    {channel?.name}
                  </p>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {allSelected ? "Quitar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subs.map((sub) => {
                    const selected = value.includes(sub.id);
                    const count = countBySubcanal.get(sub.id) ?? 0;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggle(sub.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                          selected
                            ? "border-transparent text-white shadow-sm"
                            : "border-dashed text-muted-foreground hover:border-solid hover:text-foreground",
                        )}
                        style={selected ? { backgroundColor: channel?.color } : undefined}
                      >
                        {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {sub.name}
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full px-1 text-[10px]",
                            selected ? "bg-white/20" : "bg-muted",
                          )}
                        >
                          <Users className="h-2.5 w-2.5" /> {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
