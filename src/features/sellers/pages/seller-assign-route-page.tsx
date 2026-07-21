import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  MapPinned,
  Phone,
  Plus,
  Save,
  Table2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Client, Route, RouteFrequency, SellerRouteAssignment } from "@/types";
import { ALL_WEEKS, WEEKDAY_DAYS } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelBadge, ColorDot } from "@/components/common/channel-badge";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { SellerStatusBadge } from "../components/seller-status-badge";
import { useAllSellers, useSeller, useUpdateSellerRoutes } from "@/hooks/use-sellers";
import { useRoutes } from "@/hooks/use-routes";
import { groupSubcanalesByChannel, getChannel, getSubcanal } from "@/data/channels";
import { SellerCoverageMap } from "../components/seller-coverage-map";
import { CoverageClientsTable } from "../components/coverage-clients-table";
import { RouteClientsModal } from "../components/route-clients-modal";
import { RoutePickerDialog } from "../components/route-picker-dialog";
import { RouteFrequencyPopover } from "../components/route-frequency-popover";
import { SelectedClientsSection } from "@/features/routes/components/selected-clients-section";
import { useClientsBySubcanales } from "@/hooks/use-clients";
import { useBlocksStore } from "@/stores/blocks-store";
import { pointInPolygon } from "@/lib/geo";
import { detectRouteConflicts } from "../lib/route-conflicts";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const sameFrequency = (a: RouteFrequency, b: RouteFrequency) =>
  a.type === b.type &&
  a.validFrom === b.validFrom &&
  a.validTo === b.validTo &&
  a.days.length === b.days.length &&
  a.days.every((d) => b.days.includes(d)) &&
  a.weeks.length === b.weeks.length &&
  a.weeks.every((w) => b.weeks.includes(w));

const sameAssignments = (a: SellerRouteAssignment[], b: SellerRouteAssignment[]) => {
  if (a.length !== b.length) return false;
  const sortById = (x: SellerRouteAssignment[]) =>
    [...x].sort((l, r) => l.routeId.localeCompare(r.routeId));
  return sortById(a).every((ai, i) => {
    const bi = sortById(b)[i];
    return ai.routeId === bi.routeId && sameFrequency(ai.frequency, bi.frequency);
  });
};

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const NEXT_YEAR_ISO = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();
const DEFAULT_FREQUENCY: RouteFrequency = {
  type: "SEMANAL",
  days: [...WEEKDAY_DAYS],
  weeks: [...ALL_WEEKS],
  validFrom: TODAY_ISO,
  validTo: NEXT_YEAR_ISO,
};

export function SellerAssignRoutePage() {
  const { code: codeParam } = useParams<{ code: string }>();
  const code = codeParam !== undefined ? Number(codeParam) : undefined;
  const navigate = useNavigate();

  const { data: seller, isLoading } = useSeller(code);
  const { data: allRoutes = [] } = useRoutes();
  const { data: allSellers = [] } = useAllSellers();
  const updateRoutes = useUpdateSellerRoutes();
  const blocks = useBlocksStore((s) => s.blocks);

  const [routeAssignments, setRouteAssignments] = useState<SellerRouteAssignment[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focusClient, setFocusClient] = useState<Client | null>(null);
  // Excluded clients mapped to the seller code that will attend them instead.
  const [reassignments, setReassignments] = useState<Record<string, number>>({});
  const [manualClientIds, setManualClientIds] = useState<Set<string>>(new Set());
  const [coverageView, setCoverageView] = useState<"map" | "table">("map");
  const [clientsRoute, setClientsRoute] = useState<Route | null>(null);
  // Client the manager was opened from (e.g. a map pin) so it can be highlighted.
  const [clientsFocusId, setClientsFocusId] = useState<string | null>(null);

  const openRouteManager = (route: Route, client?: Client) => {
    setClientsRoute(route);
    setClientsFocusId(client?.id ?? null);
  };
  const closeRouteManager = () => {
    setClientsRoute(null);
    setClientsFocusId(null);
  };

  // A client is "excluded" precisely when it has a replacement seller.
  const excludedClientIds = useMemo(() => new Set(Object.keys(reassignments)), [reassignments]);

  // Any seller except the one being edited can take over an excluded client.
  const replacementSellers = useMemo(
    () => allSellers.filter((s) => s.code !== seller?.code),
    [allSellers, seller?.code],
  );

  const withToggle = (id: string, value: boolean) => (prev: Set<string>) => {
    const next = new Set(prev);
    if (value) next.add(id);
    else next.delete(id);
    return next;
  };

  // Excluding and choosing a replacement are a single operation, so a client is
  // never excluded without a seller assigned to attend it.
  const reassignClient = (client: Client, sellerCode: number) =>
    setReassignments((prev) => ({ ...prev, [client.id]: sellerCode }));
  const includeClient = (client: Client) =>
    setReassignments((prev) => {
      const next = { ...prev };
      delete next[client.id];
      return next;
    });

  const setClientManual = (id: string, value: boolean) => setManualClientIds(withToggle(id, value));

  useEffect(() => {
    if (seller) setRouteAssignments(seller.routeAssignments);
  }, [seller]);

  const assignedRoutes = useMemo(
    () => routeAssignments.map((a) => allRoutes.find((r) => r.id === a.routeId)).filter((r): r is Route => !!r),
    [routeAssignments, allRoutes],
  );
  const candidateRoutes = useMemo(
    () => allRoutes.filter((r) => !routeAssignments.some((a) => a.routeId === r.id)),
    [allRoutes, routeAssignments],
  );

  // The route a client belongs to: by its manzano first, else by matching subcanal
  // (covers manually-assigned clients outside the polygons). Used to open the
  // manager focused on a client from the map or the coverage table.
  const routeForClient = (client: Client) =>
    assignedRoutes.find((r) =>
      blocks.some((b) => r.blockIds.includes(b.id) && pointInPolygon([client.lat, client.lng], b.polygon)),
    ) ?? assignedRoutes.find((r) => r.subcanalIds.includes(client.subcanalId));
  const openClientManager = (client: Client) => {
    const route = routeForClient(client);
    if (route) openRouteManager(route, client);
  };

  const derivedChannelIds = useMemo(
    () => Array.from(new Set(assignedRoutes.flatMap((r) => r.channelIds))),
    [assignedRoutes],
  );
  const derivedSubcanalIds = useMemo(
    () => Array.from(new Set(assignedRoutes.flatMap((r) => r.subcanalIds))),
    [assignedRoutes],
  );

  const assignedBlockIds = useMemo(
    () => assignedRoutes.flatMap((r) => r.blockIds),
    [assignedRoutes],
  );

  const { data: clients = [] } = useClientsBySubcanales(derivedSubcanalIds);

  const dirty = seller ? !sameAssignments(routeAssignments, seller.routeAssignments) : false;

  // Routes that would visit the same clients twice (same manzano + channel +
  // client + overlapping frequency). Recomputed as assignments/exclusions change.
  const conflicts = useMemo(
    () =>
      detectRouteConflicts(
        routeAssignments,
        (id) => allRoutes.find((r) => r.id === id),
        clients,
        blocks,
        excludedClientIds,
      ),
    [routeAssignments, allRoutes, clients, blocks, excludedClientIds],
  );
  const conflictByRoute = useMemo(() => {
    const map = new Map<string, (typeof conflicts)[number]>();
    for (const c of conflicts) if (!map.has(c.routeId)) map.set(c.routeId, c);
    return map;
  }, [conflicts]);
  const hasConflicts = conflicts.length > 0;

  const addRoute = (route: Route) => {
    const nextAssignments = [
      ...routeAssignments,
      {
        routeId: route.id,
        frequency: {
          ...DEFAULT_FREQUENCY,
          days: [...DEFAULT_FREQUENCY.days],
          weeks: [...DEFAULT_FREQUENCY.weeks],
        },
      },
    ];
    setRouteAssignments(nextAssignments);
    setFocusClient(null);
    // Best-effort immediate warning; the reactive banner is the source of truth.
    const probe = detectRouteConflicts(
      nextAssignments,
      (id) => allRoutes.find((r) => r.id === id),
      clients,
      blocks,
      excludedClientIds,
    );
    if (probe.some((c) => c.routeId === route.id)) {
      toast.warning("La ruta se solapa con otra asignada", {
        description:
          "Comparten manzanos, canal, clientes y frecuencia. Ajustá la frecuencia o excluí los clientes en común.",
      });
    }
  };
  const removeRoute = (routeId: string) => {
    setRouteAssignments((prev) => prev.filter((a) => a.routeId !== routeId));
    setFocusClient(null);
  };
  const updateFrequency = (routeId: string, freq: SellerRouteAssignment["frequency"]) => {
    setRouteAssignments((prev) =>
      prev.map((a) => (a.routeId === routeId ? { ...a, frequency: freq } : a)),
    );
  };

  const handleSave = async () => {
    if (code === undefined) return;
    if (hasConflicts) {
      toast.error("Hay rutas en conflicto", {
        description: "Resolvé los solapamientos antes de guardar.",
      });
      return;
    }
    await updateRoutes.mutateAsync({ code, routeAssignments });
    navigate("/sellers");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <EmptyState
        icon={Users}
        title="Vendedor no encontrado"
        description="Puede que haya sido eliminado."
        action={
          <Button onClick={() => navigate("/sellers")}>
            <ArrowLeft className="h-4 w-4" /> Volver a vendedores
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Seller identity lives in the header — no separate info card needed. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials(seller.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{seller.name}</h1>
              <SellerStatusBadge status={seller.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="font-mono">{seller.code}</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {seller.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {seller.phone ?? "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/sellers")}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || updateRoutes.isPending || hasConflicts}
            title={hasConflicts ? "Resolvé los conflictos de rutas antes de guardar" : undefined}
          >
            {updateRoutes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* ---- Info column (scrollable) ---- */}
        <div className="space-y-6 overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
          <Card>
            <CardContent className="space-y-5 p-5">
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Canales de venta
                </h4>
                {derivedChannelIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {derivedChannelIds.map((cid) => (
                      <ChannelBadge key={cid} channelId={cid} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sin canales — se completan al asignar una ruta.
                  </p>
                )}
              </section>

              <section className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Subcanales
                </h4>
                {derivedSubcanalIds.length > 0 ? (
                  <div className="space-y-2">
                    {groupSubcanalesByChannel(derivedSubcanalIds).map(({ channelId, ids }) => {
                      const channel = getChannel(channelId);
                      return (
                        <div key={channelId} className="space-y-1">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                            <ColorDot color={channel?.color ?? "#64748b"} className="h-2 w-2" />
                            {channel?.name}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {ids.map((sid) => (
                              <span
                                key={sid}
                                className="rounded-full border px-2 py-0.5 text-xs font-medium"
                                style={{
                                  color: channel?.color,
                                  borderColor: `${channel?.color}55`,
                                  backgroundColor: `${channel?.color}14`,
                                }}
                              >
                                {getSubcanal(sid)?.name ?? sid}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin subcanales.</p>
                )}
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rutas asignadas
                </h4>
                <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Asignar ruta
                </Button>
              </div>

              {hasConflicts && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-medium">Rutas en conflicto</p>
                    <p className="text-destructive/80">
                      Una ruta duplica a otra en un mismo canal (mismos clientes y frecuencia):
                      el vendedor los visitaría dos veces. Ajustá la frecuencia, excluí los
                      clientes en común o quitá una de las rutas para poder guardar.
                    </p>
                  </div>
                </div>
              )}

              {assignedRoutes.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  Este vendedor no tiene rutas asignadas.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {assignedRoutes.map((route) => {
                    const assignment = routeAssignments.find((a) => a.routeId === route.id);
                    const conflict = conflictByRoute.get(route.id);
                    return (
                      <li
                        key={route.id}
                        className={cn(
                          "space-y-1.5 rounded-lg border px-3 py-2 text-sm",
                          conflict && "border-destructive/40 bg-destructive/5",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <ColorDot color={route.color} />
                          <span className="min-w-0 flex-1 truncate font-medium">{route.name}</span>
                          {conflict && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive"
                              title={`Idéntica a ${conflict.otherRouteName} en el canal ${conflict.channelName}: ${conflict.sharedClients} cliente(s) duplicados con la misma frecuencia.`}
                            >
                              <AlertTriangle className="h-3 w-3" /> Conflicto
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openRouteManager(route)}
                            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="Ver y gestionar clientes de la ruta"
                          >
                            <Users className="h-3 w-3" /> {route.clientCount}
                          </button>
                          <StatusBadge status={route.status} />
                          <button
                            type="button"
                            onClick={() => removeRoute(route.id)}
                            className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Quitar ${route.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {assignment && (
                          <RouteFrequencyPopover
                            value={assignment.frequency}
                            onChange={(freq) => updateFrequency(route.id, freq)}
                            routeColor={route.color}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <SelectedClientsSection
            subcanalIds={derivedSubcanalIds}
            blockIds={assignedBlockIds}
            clients={clients}
            onClientClick={setFocusClient}
            excludedClientIds={excludedClientIds}
            sellers={replacementSellers}
            reassignments={reassignments}
            onManageClient={openClientManager}
          />
        </div>

        {/* ---- Coverage column: map or table ---- */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              {coverageView === "map"
                ? "Cobertura por ruta — cada color es la ruta asignada"
                : "Clientes en cobertura — incluir o excluir"}
            </span>
            <div className="flex shrink-0 overflow-hidden rounded-md border text-xs">
              <button
                type="button"
                onClick={() => setCoverageView("map")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 transition-colors",
                  coverageView === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <MapPinned className="h-3.5 w-3.5" /> Mapa
              </button>
              <button
                type="button"
                onClick={() => setCoverageView("table")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 transition-colors",
                  coverageView === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Table2 className="h-3.5 w-3.5" /> Tabla
              </button>
            </div>
          </div>
          <div className="h-[460px] lg:h-[calc(100%-2rem)]">
            {coverageView === "map" ? (
              <SellerCoverageMap
                routes={assignedRoutes}
                focusClient={focusClient}
                excludedClientIds={excludedClientIds}
                manualClientIds={manualClientIds}
                onManageClient={openClientManager}
              />
            ) : (
              <CoverageClientsTable
                clients={clients}
                subcanalIds={derivedSubcanalIds}
                blockIds={assignedBlockIds}
                excludedClientIds={excludedClientIds}
                manualClientIds={manualClientIds}
                sellers={replacementSellers}
                reassignments={reassignments}
                onManageClient={openClientManager}
              />
            )}
          </div>
        </div>
      </div>

      <RoutePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        candidates={candidateRoutes}
        onPick={(route) => addRoute(route)}
      />

      <RouteClientsModal
        route={clientsRoute}
        open={!!clientsRoute}
        onOpenChange={(o) => !o && closeRouteManager()}
        focusClientId={clientsFocusId}
        excludedClientIds={excludedClientIds}
        manualClientIds={manualClientIds}
        sellers={replacementSellers}
        reassignments={reassignments}
        onReassign={reassignClient}
        onInclude={includeClient}
        setClientManual={setClientManual}
      />
    </>
  );
}
