import { useEffect, useMemo, useRef, useState } from "react";
import {
  Asterisk,
  Check,
  CheckCircle2,
  ClipboardList,
  FilterX,
  Pencil,
  Plus,
  Search,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Block, ClientTask, LatLng, Market } from "@/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { useClientTasks } from "@/hooks/use-client-tasks";
import { useRoutes } from "@/hooks/use-routes";
import { useClients } from "@/hooks/use-clients";
import { useChannels } from "@/hooks/use-channels";
import { useMarkets } from "@/hooks/use-markets";
import { useBlocksStore } from "@/stores/blocks-store";
import { CITIES } from "@/data/locations";
import { ChannelMultiSelect } from "@/features/routes/components/channel-multiselect";
import { ClientTaskTypeBadge } from "../components/client-task-type-badge";
import { ClientTaskMap } from "../components/client-task-map";
import { AssignClientsToTasksDialog } from "../components/assign-clients-to-tasks-dialog";
import { UnassignClientsSheet } from "../components/unassign-clients-sheet";
import { ClientTaskFormDialog } from "../components/client-task-form-dialog";
import { SelectionTabs } from "../components/selection-tabs";
import { clientsInBlocks } from "../lib/task-selection";

const CITY_FILTER_OPTIONS = [
  { value: "", label: "Todas las ciudades" },
  ...CITIES.map((c) => ({ value: c.name, label: c.name })),
];

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export function ClientTasksMapPage() {
  const { data: tasks = [], isLoading: loadingTasks } = useClientTasks();
  const { data: routes = [] } = useRoutes();
  const { data: clients = [] } = useClients();
  const { data: channels = [] } = useChannels();
  const { data: markets = [] } = useMarkets();
  const blocks = useBlocksStore((s) => s.blocks);

  const [taskSearch, setTaskSearch] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<string[]>([]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(new Set());
  const [selectedMarketIds, setSelectedMarketIds] = useState<Set<string>>(new Set());
  // Manzanos added by clicking the map, and manzanos carved out of a source.
  const [manualBlockIds, setManualBlockIds] = useState<Set<string>>(new Set());
  const [excludedBlockIds, setExcludedBlockIds] = useState<Set<string>>(new Set());
  const [resolvedClientIds, setResolvedClientIds] = useState<string[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignTask, setUnassignTask] = useState<ClientTask | null>(null);
  // `null` = closed, "new" = create mode, a task = edit mode.
  const [formTask, setFormTask] = useState<ClientTask | "new" | null>(null);

  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const hasFilters = cityFilter !== "" || channelFilter.length > 0;

  // Clients shown on the map: the whole universe, or only the selected channel(s).
  const visibleClients = useMemo(
    () =>
      channelFilter.length === 0
        ? clients
        : clients.filter((c) => channelFilter.includes(c.channelId)),
    [clients, channelFilter],
  );

  // Markets belong to the traditional channel — only offer the tab when it's in the filter.
  const tradicionalId = channels.find((c) => c.name === "TRADICIONAL")?.id;
  const showMarketsTab = !!tradicionalId && channelFilter.includes(tradicionalId);

  // City + channel filters scope the routes shown on the map and in the list.
  const filteredRoutes = useMemo(
    () =>
      routes.filter(
        (r) =>
          (cityFilter === "" || r.cityName === cityFilter) &&
          (channelFilter.length === 0 || r.channelIds.some((c) => channelFilter.includes(c))),
      ),
    [routes, cityFilter, channelFilter],
  );

  // Per-route geographic client / manzano counts (matches the map's resolution).
  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const routeStats = useMemo(() => {
    const q = routeSearch.trim().toLowerCase();
    return filteredRoutes
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .map((route) => {
        const routeBlocks = route.blockIds
          .map((id) => blockById.get(id))
          .filter((b): b is Block => !!b);
        return {
          route,
          blockCount: routeBlocks.length,
          clientCount: clientsInBlocks(clients, routeBlocks).length,
        };
      });
  }, [filteredRoutes, routeSearch, blockById, clients]);

  const taskList = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    return tasks.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [tasks, taskSearch]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => selectedTaskIds.has(t.id)),
    [tasks, selectedTaskIds],
  );

  const activeCount = tasks.filter((t) => t.status === "active").length;
  const requiredCount = tasks.filter((t) => t.required).length;
  const nextOrder = tasks.reduce((max, t) => Math.max(max, t.order), 0) + 1;

  const toggleTask = (id: number) =>
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleRoute = (id: string) =>
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Add or remove a batch of routes at once (used by the Empleados tab).
  const setRoutesSelected = (ids: string[], selected: boolean) =>
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (selected) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });

  // Selecting a market only marks it as selected; its manzanos are contributed
  // through `sourceBlockIds`, so nothing has to be added/removed by hand.
  const toggleMarket = (market: Market) =>
    setSelectedMarketIds((prev) => {
      const next = new Set(prev);
      if (next.has(market.id)) next.delete(market.id);
      else next.add(market.id);
      return next;
    });

  // Manzanos contributed by the current route + market selection.
  const sourceBlockIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of routes) if (selectedRouteIds.has(r.id)) r.blockIds.forEach((id) => s.add(id));
    for (const m of markets) if (selectedMarketIds.has(m.id)) m.blockIds.forEach((id) => s.add(id));
    return s;
  }, [routes, markets, selectedRouteIds, selectedMarketIds]);

  // Effective target set used for the "Clientes seleccionados" count / assign.
  const targetBlockIds = useMemo(() => {
    const s = new Set(sourceBlockIds);
    manualBlockIds.forEach((id) => s.add(id));
    excludedBlockIds.forEach((id) => s.delete(id));
    return s;
  }, [sourceBlockIds, manualBlockIds, excludedBlockIds]);

  // Clicking a manzano: re-include if excluded, exclude if it comes from a
  // source, otherwise toggle it as a standalone manual pick.
  const handleBlockClick = (blockId: string) => {
    if (excludedBlockIds.has(blockId)) {
      setExcludedBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
      return;
    }
    if (sourceBlockIds.has(blockId)) {
      setExcludedBlockIds((prev) => new Set(prev).add(blockId));
      return;
    }
    setManualBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedRouteIds(new Set());
    setSelectedMarketIds(new Set());
    setManualBlockIds(new Set());
    setExcludedBlockIds(new Set());
  };

  // Fit the camera to the selected routes' manzanos, or to every manzano plus
  // every visible client when nothing is selected. Only route/channel changes
  // affect this, so clicking a manzano never moves the camera.
  const fitPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    const selectedRoutes = routes.filter((r) => selectedRouteIds.has(r.id));
    if (selectedRoutes.length) {
      for (const r of selectedRoutes) {
        for (const id of r.blockIds) blockById.get(id)?.polygon.forEach((p) => pts.push(p));
      }
      return pts;
    }
    blocks.forEach((b) => b.polygon.forEach((p) => pts.push(p)));
    visibleClients.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [routes, selectedRouteIds, blocks, blockById, visibleClients]);

  // If TRADICIONAL leaves the channel filter, drop the market selection.
  useEffect(() => {
    if (!showMarketsTab && selectedMarketIds.size > 0) setSelectedMarketIds(new Set());
  }, [showMarketsTab, selectedMarketIds]);

  const canAssign = selectedTaskIds.size > 0 && resolvedClientIds.length > 0;

  return (
    <>
      <PageHeader
        title="Tareas por Cliente"
        description="Selecciona tareas y define, sobre el mapa, a qué clientes aplicarlas."
      >
        <Button onClick={() => setAssignOpen(true)} disabled={!canAssign}>
          <Check className="h-4 w-4" /> Asignar tareas
        </Button>
      </PageHeader>

      {loadingTasks ? (
        <Skeleton className="h-[70vh] w-full rounded-xl" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* ---- Task-oriented KPIs ---- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={ClipboardList} label="Total tareas" value={String(tasks.length)} />
            <StatCard icon={CheckCircle2} label="Activas" value={String(activeCount)} />
            <StatCard icon={Asterisk} label="Requeridas" value={String(requiredCount)} />
            <StatCard icon={Users} label="Clientes seleccionados" value={String(resolvedClientIds.length)} />
          </div>

          {/* ---- Filters (scope routes + map) ---- */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
              <Combobox
                options={CITY_FILTER_OPTIONS}
                value={cityFilter}
                onChange={setCityFilter}
                placeholder="Todas las ciudades"
                searchPlaceholder="Buscar ciudad…"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Canal de venta</label>
              <ChannelMultiSelect channels={channels} value={channelFilter} onChange={setChannelFilter} />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="sm:mt-5"
                onClick={() => {
                  setCityFilter("");
                  setChannelFilter([]);
                }}
              >
                <FilterX className="h-4 w-4" /> Limpiar
              </Button>
            )}
          </div>

          {/* ---- Three zones: tasks · map · routes ---- */}
          <div className="flex min-h-[460px] flex-1 flex-col gap-4 xl:flex-row">
            {/* LEFT — client-task list (multi-select) */}
            <div className="flex max-h-[70vh] w-full flex-col overflow-hidden rounded-xl border bg-card xl:h-full xl:max-h-none xl:w-80 xl:shrink-0">
              <div className="space-y-2 border-b p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Tareas{" "}
                    {selectedTaskIds.size > 0 && (
                      <span className="text-muted-foreground">({selectedTaskIds.size})</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedTaskIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskIds(new Set())}
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="h-3 w-3" /> Limpiar
                      </button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setFormTask("new")}
                    >
                      <Plus className="h-3.5 w-3.5" /> Nueva tarea
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Buscar tarea…"
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>

              <ul className="flex-1 space-y-2 overflow-y-auto p-2">
                {taskList.length === 0 ? (
                  <li className="py-8 text-center text-xs text-muted-foreground">Sin tareas.</li>
                ) : (
                  taskList.map((task) => {
                    const isSelected = selectedTaskIds.has(task.id);
                    const assignedLabel =
                      task.assignScope === "all"
                        ? "Todos los clientes"
                        : `${task.clientIds.length} cliente(s)`;
                    return (
                      <li key={task.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className="flex w-full items-start gap-2.5 px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <ColorDot color={task.color} className="mt-1 h-3 w-3" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="min-w-0 truncate font-medium">{task.name}</span>
                              {task.required && (
                                <Asterisk className="h-3 w-3 shrink-0 text-destructive" aria-label="Requerida" />
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <ClientTaskTypeBadge type={task.type} />
                              <span className="truncate text-[11px] text-muted-foreground">{assignedLabel}</span>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center justify-between border-t px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setFormTask(task)}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnassignTask(task)}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <UserMinus className="h-3.5 w-3.5" /> Quitar clientes
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* CENTER — map */}
            <div ref={mapWrapperRef} className="h-[60vh] min-w-0 flex-1 xl:h-full">
              <ClientTaskMap
                routes={routes}
                blocks={blocks}
                clients={visibleClients}
                sourceBlockIds={sourceBlockIds}
                manualBlockIds={manualBlockIds}
                excludedBlockIds={excludedBlockIds}
                onBlockClick={handleBlockClick}
                onResolvedClientsChange={setResolvedClientIds}
                fitPoints={fitPoints}
                fullscreenTargetRef={mapWrapperRef}
              />
            </div>

            {/* RIGHT — selection tabs (routes / employees / markets) drive the map */}
            <SelectionTabs
              routeStats={routeStats}
              routeSearch={routeSearch}
              onRouteSearchChange={setRouteSearch}
              filteredRoutes={filteredRoutes}
              selectedRouteIds={selectedRouteIds}
              onToggleRoute={toggleRoute}
              onSetRoutesSelected={setRoutesSelected}
              targetBlockIds={targetBlockIds}
              excludedBlockIds={excludedBlockIds}
              onClearAll={clearSelection}
              markets={markets}
              selectedMarketIds={selectedMarketIds}
              onToggleMarket={toggleMarket}
              showMarketsTab={showMarketsTab}
            />
          </div>
        </div>
      )}

      <AssignClientsToTasksDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        tasks={selectedTasks}
        clientIds={resolvedClientIds}
        clients={clients}
      />

      <UnassignClientsSheet
        task={unassignTask}
        open={!!unassignTask}
        onOpenChange={(o) => !o && setUnassignTask(null)}
      />

      <ClientTaskFormDialog
        open={formTask !== null}
        onOpenChange={(o) => !o && setFormTask(null)}
        task={formTask === "new" ? null : formTask}
        nextOrder={nextOrder}
      />
    </>
  );
}
