import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, GripVertical, Route as RouteIcon, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import type { Block, Client, Route, RouteFrequency, Seller, SellerRouteAssignment, SellerStatus } from "@/types";
import { ALL_WEEKS, WEEKDAY_DAYS } from "@/types";
import { cn } from "@/lib/utils";
import { getChannel } from "@/data/channels";
import { useUpdateSellerRoutes } from "@/hooks/use-sellers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/common/pagination";
import { ColorDot } from "@/components/common/channel-badge";
import { SellerStatusBadge } from "./seller-status-badge";
import { detectRouteConflicts } from "../lib/route-conflicts";
import { FrequencyEditor } from "./frequency-editor";
import { summarizeFrequency } from "./route-frequency-popover";

interface AssignSellersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routes to show as drop targets (already filtered by city/channel). */
  routes: Route[];
  /** Every route — used to resolve existing assignments when checking conflicts. */
  allRoutes: Route[];
  sellers: Seller[];
  clients: Client[];
  blocks: Block[];
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const NEXT_YEAR_ISO = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();
const defaultFrequency = (): RouteFrequency => ({
  type: "SEMANAL",
  days: [...WEEKDAY_DAYS],
  weeks: [...ALL_WEEKS],
  validFrom: TODAY_ISO,
  validTo: NEXT_YEAR_ISO,
});

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const SELLERS_PER_PAGE = 8;

export function AssignSellersDialog({
  open,
  onOpenChange,
  routes,
  allRoutes,
  sellers,
  clients,
  blocks,
}: AssignSellersDialogProps) {
  const updateRoutes = useUpdateSellerRoutes();
  const [sellerQuery, setSellerQuery] = useState("");
  const [routeQuery, setRouteQuery] = useState("");
  const [dragSeller, setDragSeller] = useState<number | null>(null);
  const [dragOverRouteId, setDragOverRouteId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ sellerCode: number; route: Route } | null>(null);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | "all">("ACTIVO");
  const [sellerPage, setSellerPage] = useState(1);
  // Local, immediately-applied override of each touched seller's assignments —
  // avoids losing an assignment while the query cache refetches between confirms.
  const [override, setOverride] = useState<Record<number, SellerRouteAssignment[]>>({});

  // Each open starts fresh from the persisted data.
  useEffect(() => {
    if (open) setOverride({});
  }, [open]);

  const sellerByCode = useMemo(() => new Map(sellers.map((s) => [s.code, s])), [sellers]);
  const routeById = useMemo(() => new Map(allRoutes.map((r) => [r.id, r])), [allRoutes]);

  /** Latest assignments for a seller (local override wins over the persisted prop). */
  const sellerAssignments = (code: number): SellerRouteAssignment[] =>
    override[code] ?? sellerByCode.get(code)?.routeAssignments ?? [];

  /** Persist a seller's full assignments immediately (optimistic via override). */
  const persist = (code: number, assignments: SellerRouteAssignment[]) => {
    setOverride((prev) => ({ ...prev, [code]: assignments }));
    updateRoutes.mutate({ code, routeAssignments: assignments });
  };

  const sellersFiltered = useMemo(() => {
    const q = sellerQuery.trim().toLowerCase();
    return sellers.filter(
      (s) =>
        (sellerStatus === "all" || s.status === sellerStatus) &&
        (!q || s.name.toLowerCase().includes(q) || String(s.code).includes(q) || s.email.toLowerCase().includes(q)),
    );
  }, [sellers, sellerQuery, sellerStatus]);

  const routesFiltered = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    return routes.filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [routes, routeQuery]);

  // Front-end pagination for the (potentially long) sellers list.
  useEffect(() => setSellerPage(1), [sellerQuery, sellerStatus]);
  const sellerTotalPages = Math.max(1, Math.ceil(sellersFiltered.length / SELLERS_PER_PAGE));
  const sp = Math.min(sellerPage, sellerTotalPages);
  const sellersPageItems = sellersFiltered.slice((sp - 1) * SELLERS_PER_PAGE, sp * SELLERS_PER_PAGE);

  /** Sellers currently on a route (with their frequency), using the latest local state. */
  const routeSellers = (routeId: string) =>
    sellers
      .map((seller) => {
        const a = sellerAssignments(seller.code).find((x) => x.routeId === routeId);
        return a ? { seller, frequency: a.frequency } : null;
      })
      .filter((x): x is { seller: Seller; frequency: RouteFrequency } => x !== null);

  /** Codes of sellers already on a route — to mark them in the list. */
  const assignedSellerCodes = (routeId: string) => new Set(routeSellers(routeId).map((x) => x.seller.code));

  const activeAssigned = activeRouteId ? assignedSellerCodes(activeRouteId) : new Set<number>();

  const dropTargetConflict = (sellerCode: number, route: Route, frequency: RouteFrequency) => {
    const effective = [...sellerAssignments(sellerCode), { routeId: route.id, frequency }];
    const conflicts = detectRouteConflicts(effective, (id) => routeById.get(id), clients, blocks, new Set());
    return conflicts.find((c) => c.routeId === route.id) ?? null;
  };

  const handleDrop = (route: Route) => {
    setDragOverRouteId(null);
    if (dragSeller === null) return;
    const sellerCode = dragSeller;
    setDragSeller(null);
    if (sellerAssignments(sellerCode).some((a) => a.routeId === route.id)) {
      toast.error("Ese vendedor ya tiene esta ruta", { description: sellerByCode.get(sellerCode)?.name });
      return;
    }
    setDropTarget({ sellerCode, route });
  };

  /** Confirming the frequency registers the assignment right away (no batch save). */
  const confirmAssign = (frequency: RouteFrequency) => {
    if (!dropTarget) return;
    const { sellerCode, route } = dropTarget;
    const conflict = dropTargetConflict(sellerCode, route, frequency);
    if (conflict) {
      toast.error("Conflicto de rutas", {
        description: `Se solapa con ${conflict.otherRouteName} en el canal ${conflict.channelName} (${conflict.sharedClients} clientes, misma frecuencia).`,
      });
      return;
    }
    persist(sellerCode, [...sellerAssignments(sellerCode), { routeId: route.id, frequency }]);
    setDropTarget(null);
    setActiveRouteId(route.id); // expand the route so the new assignment is visible
  };

  /** Unassign a seller from a route (also persisted immediately). */
  const removeAssignment = (sellerCode: number, routeId: string) =>
    persist(sellerCode, sellerAssignments(sellerCode).filter((a) => a.routeId !== routeId));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle>Asignar vendedores a rutas</DialogTitle>
            <DialogDescription>
              Arrastrá un vendedor sobre una ruta para asignarlo. Se te pedirá la frecuencia y se
              valida que no queden dos rutas del mismo canal y frecuencia sobre los mismos clientes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {/* ---- Sellers ---- */}
            <div className="flex min-h-0 flex-col rounded-xl border bg-muted/20">
              <div className="space-y-2 border-b p-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Vendedores
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sellerQuery}
                      onChange={(e) => setSellerQuery(e.target.value)}
                      placeholder="Buscar vendedor…"
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                  <Select
                    value={sellerStatus}
                    onValueChange={(v) => setSellerStatus(v as SellerStatus | "all")}
                  >
                    <SelectTrigger className="h-8 w-28 shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activos</SelectItem>
                      <SelectItem value="INACTIVO">Inactivos</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                {sellersFiltered.length === 0 ? (
                  <li className="py-8 text-center text-xs text-muted-foreground">Sin vendedores.</li>
                ) : (
                  sellersPageItems.map((s) => {
                    const inActive = activeAssigned.has(s.code);
                    return (
                      <li
                        key={s.code}
                        draggable={!inActive}
                        onDragStart={() => !inActive && setDragSeller(s.code)}
                        onDragEnd={() => {
                          setDragSeller(null);
                          setDragOverRouteId(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-xs shadow-sm transition-colors",
                          inActive
                            ? "cursor-default border-primary/40 bg-primary/5"
                            : "cursor-grab hover:border-primary/40 active:cursor-grabbing",
                          dragSeller === s.code && "opacity-50",
                        )}
                      >
                        <GripVertical
                          className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", inActive && "opacity-0")}
                        />
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {initials(s.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="min-w-0 truncate font-medium">{s.name}</span>
                            <span className="shrink-0">
                              <SellerStatusBadge status={s.status} />
                            </span>
                          </div>
                          <div className="truncate text-[10px] text-muted-foreground">{s.email}</div>
                        </div>
                        {inActive && (
                          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <Check className="h-3 w-3" /> En esta ruta
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
              {sellerTotalPages > 1 && (
                <div className="border-t p-2">
                  <Pagination page={sp} totalPages={sellerTotalPages} onPageChange={setSellerPage} />
                </div>
              )}
            </div>

            {/* ---- Routes (drop targets) ---- */}
            <div className="flex min-h-0 flex-col rounded-xl border bg-muted/20">
              <div className="space-y-2 border-b p-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <RouteIcon className="h-3.5 w-3.5" /> Rutas
                </span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={routeQuery}
                    onChange={(e) => setRouteQuery(e.target.value)}
                    placeholder="Buscar ruta…"
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                {routesFiltered.length === 0 ? (
                  <li className="py-8 text-center text-xs text-muted-foreground">
                    No hay rutas con los filtros actuales.
                  </li>
                ) : (
                  routesFiltered.map((route) => {
                    const assigned = routeSellers(route.id);
                    const expanded = activeRouteId === route.id;
                    const isOver = dragOverRouteId === route.id;
                    return (
                      <li
                        key={route.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverRouteId(route.id);
                        }}
                        onDrop={() => handleDrop(route)}
                        className={cn(
                          "overflow-hidden rounded-lg border bg-card text-xs shadow-sm transition-colors",
                          isOver ? "border-primary ring-2 ring-primary/40" : "border-border",
                        )}
                      >
                        {/* Header — click to expand the sellers on this route */}
                        <button
                          type="button"
                          onClick={() => setActiveRouteId(expanded ? null : route.id)}
                          className={cn(
                            "flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors",
                            isOver ? "bg-primary/10" : "hover:bg-accent/50",
                          )}
                        >
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <ColorDot color={route.color} className="h-3 w-3 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{route.name}</div>
                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                              {route.channelIds.map((cid) => (
                                <span key={cid} className="rounded-full border px-1 py-px font-medium">
                                  {getChannel(cid)?.name ?? cid}
                                </span>
                              ))}
                              {route.cityName && <span className="text-muted-foreground/70">· {route.cityName}</span>}
                            </div>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Users className="h-3 w-3" /> {assigned.length}
                          </span>
                        </button>

                        {/* Expanded — sellers currently on this route */}
                        {expanded && (
                          <div className="space-y-1 border-t px-2.5 py-2">
                            {assigned.length === 0 ? (
                              <p className="py-1 text-center text-[11px] text-muted-foreground">
                                Sin vendedores. Arrastrá uno aquí.
                              </p>
                            ) : (
                              assigned.map(({ seller, frequency }) => (
                                <div
                                  key={seller.code}
                                  className="flex items-center gap-1.5 rounded bg-muted/60 px-1.5 py-1"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/70 text-[9px] font-semibold">
                                    {initials(seller.name)}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate font-medium">{seller.name}</span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {summarizeFrequency(frequency)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeAssignment(seller.code, route.id)}
                                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    title="Quitar de la ruta"
                                    aria-label="Quitar de la ruta"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              Cada asignación se registra al confirmar la frecuencia.
            </span>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Frequency step (after a drop) ---- */}
      <Dialog open={!!dropTarget} onOpenChange={(o) => !o && setDropTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Frecuencia de visita</DialogTitle>
            <DialogDescription>
              {dropTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {sellerByCode.get(dropTarget.sellerCode)?.name}
                  </span>{" "}
                  → {dropTarget.route.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {dropTarget && (
            <FrequencyEditor
              value={defaultFrequency()}
              onApply={confirmAssign}
              onCancel={() => setDropTarget(null)}
              applyLabel="Confirmar asignación"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
