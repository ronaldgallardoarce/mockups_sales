import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  MapIcon,
  PanelRightClose,
  PanelRightOpen,
  Receipt,
  Save,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { routeSchema, type RouteFormValues } from "../route-schema";
import { getSubcanalesByChannel } from "@/data/channels";
import { CITIES, provinceForCity } from "@/data/locations";
import { useChannels } from "@/hooks/use-channels";
import { useClients } from "@/hooks/use-clients";
import { useCreateRoute, useRoute, useUpdateRoute } from "@/hooks/use-routes";
import { useMarkets } from "@/hooks/use-markets";
import { useAllSellers, useUpdateSellerRoutes } from "@/hooks/use-sellers";
import { useRole, canViewMarkets } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/common/color-picker";
import { ColorDot } from "@/components/common/channel-badge";
import { PageHeader } from "@/components/common/page-header";
import { RouteCodeInput, ROUTE_NAME_MAX_LENGTH } from "../components/route-code-input";
import { AssignMarketDialog } from "../components/assign-market-dialog";
import { ChannelMultiSelect } from "../components/channel-multiselect";
import { SubcanalSelector } from "../components/subcanal-selector";
import { RouteMapSelector } from "../components/route-map-selector";
import { SelectedClientsSection } from "../components/selected-clients-section";
import { RouteSellerAssign, type RouteSellerAssignment } from "@/features/sellers/components/route-seller-assign";
import { bs, computeSelectionMetrics, useSelectionClients } from "../lib/route-metrics";

const CITY_OPTIONS = CITIES.map((c) => ({ value: c.name, label: c.name }));

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function RouteFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: channels = [], isLoading: loadingChannels } = useChannels();
  const { data: clients = [] } = useClients();
  const { data: markets = [] } = useMarkets();
  const { data: existing, isLoading: loadingRoute } = useRoute(id);
  const role = useRole();
  const { data: allSellers = [] } = useAllSellers();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const updateSellerRoutes = useUpdateSellerRoutes();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: "",
      color: "#264bc5",
      status: "active",
      cityName: "",
      channelIds: [],
      subcanalIds: [],
      blockIds: [],
      marketIds: [],
    },
  });

  // Hydrate the form when editing.
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        color: existing.color,
        status: existing.status,
        cityName: existing.cityName ?? "",
        channelIds: existing.channelIds,
        subcanalIds: existing.subcanalIds,
        blockIds: existing.blockIds,
        marketIds: existing.marketIds ?? [],
      });
    }
  }, [existing, reset]);

  const channelIds = watch("channelIds");
  const subcanalIds = watch("subcanalIds");
  const blockIds = watch("blockIds");
  const marketIds = watch("marketIds");
  const status = watch("status");
  const cityName = watch("cityName");
  const name = watch("name");

  // Channel names of the current selection — feeds the route code preview.
  const selectedChannelNames = channels
    .filter((c) => channelIds.includes(c.id))
    .map((c) => c.name);

  // Markets are only for traditional-channel routes, and only for roles that
  // oversee markets (admin / supervisor).
  const isTradicional = channels.some(
    (c) => channelIds.includes(c.id) && c.name === "TRADICIONAL",
  );
  const showMarkets = isTradicional && canViewMarkets(role);
  const assignedMarkets = useMemo(
    () => markets.filter((m) => marketIds.includes(m.id)),
    [markets, marketIds],
  );

  // Manzanos that belong to an assigned market are painted in that market's color.
  const marketBlockColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of assignedMarkets) for (const b of m.blockIds) map[b] = m.color;
    return map;
  }, [assignedMarkets]);

  // Ticket promedio / drop size of the clients currently covered by the selection.
  const selectionClients = useSelectionClients(clients, subcanalIds, blockIds);
  const selectionMetrics = useMemo(() => computeSelectionMetrics(selectionClients), [selectionClients]);

  const [focusClient, setFocusClient] = useState<Client | null>(null);
  const [marketDialogOpen, setMarketDialogOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  // Market whose full extent is previewed on the map (to compare vs the selection).
  const [previewMarketId, setPreviewMarketId] = useState<string | null>(null);

  const previewMarket = useMemo(
    () => assignedMarkets.find((m) => m.id === previewMarketId) ?? null,
    [assignedMarkets, previewMarketId],
  );

  // Sellers assigned to this route (with frequency) — persisted after the route on save.
  const [sellerAssignments, setSellerAssignments] = useState<RouteSellerAssignment[]>([]);
  const seededForId = useRef<string | null>(null);
  useEffect(() => {
    if (!isEdit || !id || allSellers.length === 0 || seededForId.current === id) return;
    setSellerAssignments(
      allSellers
        .filter((s) => s.routeAssignments.some((a) => a.routeId === id))
        .map((s) => ({
          sellerCode: s.code,
          frequency: s.routeAssignments.find((a) => a.routeId === id)!.frequency,
        })),
    );
    seededForId.current = id;
  }, [isEdit, id, allSellers]);

  const toggleBlock = (blockId: string) => {
    const next = blockIds.includes(blockId)
      ? blockIds.filter((b) => b !== blockId)
      : [...blockIds, blockId];
    setValue("blockIds", next, { shouldValidate: true, shouldDirty: true });
    setFocusClient(null);
  };

  /**
   * Set the route's assigned markets to `nextMarketIds`, syncing manzanos:
   * manually-picked manzanos are kept, and the selected markets' manzanos are
   * (re)added — so both assigning and unassigning update the map consistently.
   */
  const applyMarkets = (nextMarketIds: string[]) => {
    const prevMarketBlocks = new Set(assignedMarkets.flatMap((m) => m.blockIds));
    const manualBlocks = blockIds.filter((b) => !prevMarketBlocks.has(b));
    const nextMarkets = markets.filter((m) => nextMarketIds.includes(m.id));
    const nextMarketBlocks = nextMarkets.flatMap((m) => m.blockIds);
    setValue("marketIds", nextMarkets.map((m) => m.id), { shouldDirty: true });
    setValue("blockIds", Array.from(new Set([...manualBlocks, ...nextMarketBlocks])), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /** Adding a channel auto-selects its subcanales; removing prunes them. */
  const handleChannels = (ids: string[]) => {
    const added = ids.filter((i) => !channelIds.includes(i));
    const removed = channelIds.filter((i) => !ids.includes(i));
    const removedSubs = new Set(removed.flatMap((c) => getSubcanalesByChannel(c).map((s) => s.id)));
    let subs = subcanalIds.filter((s) => !removedSubs.has(s));
    for (const c of added) subs = [...subs, ...getSubcanalesByChannel(c).map((s) => s.id)];
    setValue("channelIds", ids, { shouldValidate: true, shouldDirty: true });
    setValue("subcanalIds", Array.from(new Set(subs)), { shouldValidate: true, shouldDirty: true });
  };

  /** Persist the route's seller assignments (children), reconciling adds/removes/changes. */
  const syncSellerAssignments = async (routeId: string) => {
    const desired = new Map(sellerAssignments.map((a) => [a.sellerCode, a.frequency]));
    const affected = new Set<number>([
      ...desired.keys(),
      ...allSellers.filter((s) => s.routeAssignments.some((a) => a.routeId === routeId)).map((s) => s.code),
    ]);
    for (const code of affected) {
      const seller = allSellers.find((s) => s.code === code);
      if (!seller) continue;
      const wantFreq = desired.get(code);
      const currentFreq = seller.routeAssignments.find((a) => a.routeId === routeId)?.frequency;
      const hadIt = currentFreq !== undefined;
      if (!hadIt && !wantFreq) continue;
      if (hadIt && wantFreq && JSON.stringify(currentFreq) === JSON.stringify(wantFreq)) continue;
      const without = seller.routeAssignments.filter((a) => a.routeId !== routeId);
      const next = wantFreq ? [...without, { routeId, frequency: wantFreq }] : without;
      await updateSellerRoutes.mutateAsync({ code, routeAssignments: next });
    }
  };

  const onSubmit = async (values: RouteFormValues) => {
    // Province is derived from the selected city, so both stay in sync.
    const input = { ...values, provinceName: provinceForCity(values.cityName) };
    // Parent first: save the route to get its id, then persist its sellers (children).
    const saved = isEdit && id
      ? await updateRoute.mutateAsync({ id, input })
      : await createRoute.mutateAsync(input);
    await syncSellerAssignments(saved.id);
    navigate("/routes");
  };

  if (isEdit && loadingRoute) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 xl:gap-5 cols:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[300px_minmax(0,1fr)_300px] 2xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
          <div className="space-y-4">
            <Skeleton className="h-[80px]" />
            <Skeleton className="h-[160px]" />
            <Skeleton className="h-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PageHeader
        title={isEdit ? "Editar ruta" : "Nueva ruta"}
        description={
          isEdit
            ? "Actualiza los datos y la cobertura de la ruta."
            : "Define una ruta de pre-venta y previsualiza su cobertura en el mapa."
        }
      >
        <Button type="button" variant="outline" onClick={() => navigate("/routes")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Guardar cambios" : "Crear ruta"}
        </Button>
      </PageHeader>

      <div
        className={cn(
          "grid gap-4 xl:gap-5",
          rightPanelOpen
            ? "cols:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[300px_minmax(0,1fr)_300px] 2xl:grid-cols-[360px_minmax(0,1fr)_360px]"
            : "cols:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]",
        )}
      >
        {/* ---- Form column: basic data (scrollable) ---- */}
        <div className="space-y-4 cols:max-h-[calc(100vh-8rem)] cols:overflow-y-auto">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Nombre de ruta</Label>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {(name?.length ?? 0)}/{ROUTE_NAME_MAX_LENGTH}
                  </span>
                </div>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <RouteCodeInput
                      id="name"
                      value={field.value}
                      onChange={(v) => field.onChange(v.toUpperCase())}
                      channels={selectedChannelNames}
                      autoId={isEdit ? id : undefined}
                      invalid={!!errors.name}
                    />
                  )}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Controller
                    control={control}
                    name="color"
                    render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
                  />
                  <FieldError message={errors.color?.message} />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex h-9 items-center gap-3 rounded-md border px-3">
                    <Switch
                      checked={status === "active"}
                      onCheckedChange={(v) =>
                        setValue("status", v ? "active" : "inactive", { shouldDirty: true })
                      }
                      disabled={!isEdit}
                      id="status"
                    />
                    <Label htmlFor="status" className="cursor-pointer font-normal">
                      {status === "active" ? "Activa" : "Inactiva"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityName">Ciudad</Label>
                <Combobox
                  id="cityName"
                  options={CITY_OPTIONS}
                  value={cityName}
                  onChange={(v) => setValue("cityName", v, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Selecciona una ciudad"
                  searchPlaceholder="Buscar ciudad…"
                  invalid={!!errors.cityName}
                />
                <FieldError message={errors.cityName?.message} />
              </div>

              <div className="space-y-2">
                <Label>Canal de venta</Label>
                <ChannelMultiSelect
                  channels={channels}
                  value={channelIds}
                  onChange={handleChannels}
                  loading={loadingChannels}
                />
                <FieldError message={errors.channelIds?.message} />
              </div>

              <div className="space-y-2">
                <Label>Subcanales</Label>
                <SubcanalSelector
                  channelIds={channelIds}
                  value={subcanalIds}
                  onChange={(ids) => setValue("subcanalIds", ids, { shouldValidate: true, shouldDirty: true })}
                  clients={clients}
                />
                <FieldError message={errors.subcanalIds?.message} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Manzano selector column ---- */}
        <div className="cols:sticky cols:top-20 cols:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapIcon className="h-4 w-4" />
              Selecciona los manzanos que componen la ruta
            </span>
            <div className="flex items-center gap-2">
              <FieldError message={errors.blockIds?.message} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setRightPanelOpen((v) => !v)}
              >
                {rightPanelOpen ? (
                  <PanelRightClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightOpen className="h-3.5 w-3.5" />
                )}
                {rightPanelOpen ? "Ocultar panel" : "Mostrar panel"}
              </Button>
            </div>
          </div>
          <div className="h-[420px] cols:h-[calc(100%-2rem)]">
            <RouteMapSelector
              value={blockIds}
              onToggle={toggleBlock}
              subcanalIds={subcanalIds}
              focusClient={focusClient}
              blockColors={marketBlockColors}
              previewBlockIds={previewMarket?.blockIds}
              previewColor={previewMarket?.color}
              previewLabel={previewMarket?.name}
            />
          </div>
        </div>

        {/* ---- Form column: sales potential, sellers, markets, clients (scrollable) ---- */}
        {rightPanelOpen && (
        <div className="space-y-4 cols:max-h-[calc(100vh-8rem)] cols:overflow-y-auto">
          {selectionClients.length > 0 && (
            <Card>
              <CardContent className="grid grid-cols-2 gap-2.5 p-5">
                <div className="rounded-lg border p-2.5">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5" /> Ticket promedio
                  </p>
                  <p className="text-sm font-semibold tabular-nums">{bs(selectionMetrics.avgTicket)}/mes</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" /> DropSize total
                  </p>
                  <p className="text-sm font-semibold tabular-nums">{bs(selectionMetrics.totalDrop)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <RouteSellerAssign
                sellers={allSellers}
                value={sellerAssignments}
                onChange={setSellerAssignments}
              />
            </CardContent>
          </Card>

          {showMarkets && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Store className="h-3.5 w-3.5" /> Mercados de la ruta
                  </h4>
                  <Button type="button" size="sm" variant="outline" onClick={() => setMarketDialogOpen(true)}>
                    <Store className="h-3.5 w-3.5" /> Asignar Mercado
                  </Button>
                </div>
                {assignedMarkets.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                    Ningún mercado asignado. Usa “Asignar Mercado” para agregar sus manzanos y clientes.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {assignedMarkets.map((m) => {
                      const selectedCount = m.blockIds.filter((b) => blockIds.includes(b)).length;
                      const partial = selectedCount < m.blockIds.length;
                      const isPreview = previewMarketId === m.id;
                      return (
                        <li
                          key={m.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                            isPreview && "border-primary/50 bg-primary/5",
                          )}
                        >
                          <ColorDot color={m.color} className="h-3.5 w-3.5" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {m.provinceName ?? "—"} ·{" "}
                              <span className={cn(partial && "font-medium text-amber-600 dark:text-amber-400")}>
                                {selectedCount}/{m.blockIds.length} manzanos
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewMarketId(isPreview ? null : m.id)}
                            title={isPreview ? "Ocultar mercado completo" : "Ver mercado completo en el mapa"}
                            aria-label={isPreview ? "Ocultar mercado completo" : "Ver mercado completo"}
                            className={cn(
                              "shrink-0 rounded-sm p-0.5 transition-colors",
                              isPreview
                                ? "text-primary hover:bg-primary/10"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                          >
                            {isPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isPreview) setPreviewMarketId(null);
                              applyMarkets(marketIds.filter((id) => id !== m.id));
                            }}
                            className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Quitar ${m.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <SelectedClientsSection
            subcanalIds={subcanalIds}
            blockIds={blockIds}
            clients={clients}
            onClientClick={setFocusClient}
            hideMetrics
          />
        </div>
        )}
      </div>

      {showMarkets && (
        <AssignMarketDialog
          open={marketDialogOpen}
          onOpenChange={setMarketDialogOpen}
          assignedMarketIds={marketIds}
          onConfirm={applyMarkets}
        />
      )}
    </form>
  );
}
