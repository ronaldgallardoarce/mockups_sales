import { useMemo, useState } from "react";
import { Ban, ChevronDown, ChevronRight, Crosshair, Undo2, Users } from "lucide-react";
import type { Client } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel, getSubcanal } from "@/data/channels";
import { useBlocksStore } from "@/stores/blocks-store";
import { pointInPolygon } from "@/lib/geo";

type ViewMode = "channel" | "subcanal" | "all";

interface SelectedClientsSectionProps {
  subcanalIds: string[];
  blockIds: string[];
  clients: Client[];
  onClientClick?: (client: Client) => void;
  /** Client ids excluded from the routes. Enables the per-client exclude toggle. */
  excludedClientIds?: Set<string>;
  /** Toggle a client's excluded state. */
  onToggleExclude?: (client: Client) => void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "channel", label: "Por Canal" },
  { value: "subcanal", label: "Por Subcanal" },
  { value: "all", label: "Todos" },
];

export function SelectedClientsSection({ subcanalIds, blockIds, clients, onClientClick, excludedClientIds, onToggleExclude }: SelectedClientsSectionProps) {
  const [mode, setMode] = useState<ViewMode>("channel");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const blocks = useBlocksStore((s) => s.blocks);
  const isExcluded = (id: string) => excludedClientIds?.has(id) ?? false;

  const filtered = useMemo(() => {
    let result = clients.filter((c) => subcanalIds.includes(c.subcanalId));
    if (blockIds.length > 0) {
      const selectedBlocks = blocks.filter((b) => blockIds.includes(b.id));
      result = result.filter((c) =>
        selectedBlocks.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)),
      );
    }
    return result;
  }, [clients, subcanalIds, blockIds, blocks]);

  const groups = useMemo(() => {
    if (mode === "all") return null;

    const map = new Map<string, Client[]>();
    for (const c of filtered) {
      const key = mode === "channel" ? c.channelId : c.subcanalId;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }

    const entries = [...map.entries()].sort((a, b) => b[1].length - a[1].length);
    return entries.map(([key, items]) => {
      if (mode === "channel") {
        const ch = getChannel(key);
        return { key, name: ch?.name ?? key, color: ch?.color, count: items.length, items };
      }
      const sub = getSubcanal(key);
      const ch = sub?.channelId ? getChannel(sub.channelId) : undefined;
      return { key, name: sub?.name ?? key, color: ch?.color, count: items.length, items };
    });
  }, [filtered, mode]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const excludeButton = (c: Client) =>
    onToggleExclude ? (
      <button
        type="button"
        onClick={() => onToggleExclude(c)}
        className={cn(
          "shrink-0 rounded p-0.5 transition-colors",
          isExcluded(c.id)
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        )}
        aria-label={isExcluded(c.id) ? `Incluir ${c.name}` : `Excluir ${c.name}`}
        title={isExcluded(c.id) ? "Volver a incluir" : "Excluir de la ruta"}
      >
        {isExcluded(c.id) ? <Undo2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
      </button>
    ) : null;

  const excludedCount = onToggleExclude
    ? filtered.filter((c) => isExcluded(c.id)).length
    : 0;

  if (subcanalIds.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          {blockIds.length > 0 ? "Clientes en polígono" : "Clientes"}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {filtered.length}
          </span>
          {excludedCount > 0 && (
            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              {excludedCount} excluidos
            </span>
          )}
        </h3>
        <div className="flex overflow-hidden rounded-md border text-xs">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={cn(
                "px-2 py-1 transition-colors",
                mode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {blockIds.length > 0
              ? "No hay clientes dentro de los polígonos seleccionados."
              : "No hay clientes en los subcanales seleccionados."}
          </p>
        ) : mode === "all" ? (
          <ul className="space-y-0.5">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", isExcluded(c.id) && "opacity-40")}
                  style={{ backgroundColor: getChannel(c.channelId)?.color }}
                />
                <span className={cn("flex-1 truncate", isExcluded(c.id) && "text-muted-foreground line-through")}>
                  {c.name}
                </span>
                <span className="shrink-0 text-muted-foreground">{c.code}</span>
                {onClientClick && (
                  <button
                    type="button"
                    onClick={() => onClientClick(c)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label={`Ir a ${c.name}`}
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                  </button>
                )}
                {excludeButton(c)}
              </li>
            ))}
          </ul>
        ) : (
          groups?.map((g) => {
            const isOpen = expanded.has(g.key);
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => toggle(g.key)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="flex-1 text-left">{g.name}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {g.count}
                  </span>
                </button>
                {isOpen && (
                  <ul className="ml-5 space-y-0.5 border-l pl-2">
                    {g.items.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                        <span className={cn("flex-1 truncate", isExcluded(c.id) && "text-muted-foreground line-through")}>
                          {c.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">{c.code}</span>
                        {onClientClick && (
                          <button
                            type="button"
                            onClick={() => onClientClick(c)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`Ir a ${c.name}`}
                          >
                            <Crosshair className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {excludeButton(c)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
