import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, Crosshair, UserCheck, Users } from "lucide-react";
import type { Client, Seller } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel, getSubcanal } from "@/data/channels";
import { bs, computeSelectionMetrics, useSelectionClients } from "../lib/route-metrics";

type ViewMode = "channel" | "subcanal" | "all";

interface SelectedClientsSectionProps {
  subcanalIds: string[];
  blockIds: string[];
  clients: Client[];
  onClientClick?: (client: Client) => void;
  /** Client ids excluded from the routes — shown struck through with who attends them. */
  excludedClientIds?: Set<string>;
  /** Sellers, to resolve the name of whoever attends an excluded client. */
  sellers?: Seller[];
  /** Excluded client id -> code of the seller that will attend it. */
  reassignments?: Record<string, number>;
  /** Open the route clients manager focused on this client (exclusion happens there). */
  onManageClient?: (client: Client) => void;
  /** Hide the ticket promedio / drop size summary — used when it's already shown elsewhere. */
  hideMetrics?: boolean;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "channel", label: "Por Canal" },
  { value: "subcanal", label: "Por Subcanal" },
  { value: "all", label: "Todos" },
];

export function SelectedClientsSection({ subcanalIds, blockIds, clients, onClientClick, excludedClientIds, sellers, reassignments, onManageClient, hideMetrics }: SelectedClientsSectionProps) {
  const [mode, setMode] = useState<ViewMode>("channel");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const isExcluded = (id: string) => excludedClientIds?.has(id) ?? false;
  const manageEnabled = !!onManageClient;
  const replacementName = (c: Client) =>
    sellers?.find((s) => s.code === reassignments?.[c.id])?.name;

  const filtered = useSelectionClients(clients, subcanalIds, blockIds);

  // Sales potential of the current coverage: average ticket, total drop size.
  const metrics = useMemo(() => computeSelectionMetrics(filtered), [filtered]);

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

  /** Read-only pill showing who attends an excluded client (changed in the modal). */
  const attendInfo = (c: Client) =>
    manageEnabled && isExcluded(c.id) ? (
      <span
        className="inline-flex max-w-[150px] shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
        title={`Atiende: ${replacementName(c) ?? "sin asignar"}`}
      >
        <UserCheck className="h-2.5 w-2.5 shrink-0" />
        <span className="shrink-0">Atiende:</span>
        <span className="truncate">{replacementName(c) ?? "sin asignar"}</span>
      </span>
    ) : null;

  /** Open the route clients manager focused on this client. */
  const clientAction = (c: Client) =>
    manageEnabled ? (
      <button
        type="button"
        onClick={() => onManageClient!(c)}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label={`Gestionar ${c.name} en la ruta`}
        title="Gestionar en la ruta"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    ) : null;

  const excludedCount = manageEnabled
    ? filtered.filter((c) => isExcluded(c.id)).length
    : 0;

  if (subcanalIds.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          {blockIds.length > 0 ? "Clientes en ruta" : "Clientes"}
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

      {!hideMetrics && filtered.length > 0 && (
        <div className="flex items-center gap-6 rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Ticket promedio</span>
            <span className="text-sm font-semibold tabular-nums">{bs(metrics.avgTicket)}/mes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">DropSize total</span>
            <span className="text-sm font-semibold tabular-nums">{bs(metrics.totalDrop)}</span>
          </div>
        </div>
      )}

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
                {attendInfo(c)}
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
                {clientAction(c)}
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
                        {attendInfo(c)}
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
                        {clientAction(c)}
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
