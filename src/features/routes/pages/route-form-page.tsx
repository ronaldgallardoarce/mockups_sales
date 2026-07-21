import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapIcon, Save, Store, X } from "lucide-react";
import type { Client } from "@/types";
import { routeSchema, type RouteFormValues } from "../route-schema";
import { getSubcanalesByChannel } from "@/data/channels";
import { PROVINCES } from "@/data/locations";
import { useChannels } from "@/hooks/use-channels";
import { useClients } from "@/hooks/use-clients";
import { useCreateRoute, useRoute, useUpdateRoute } from "@/hooks/use-routes";
import { useMarkets } from "@/hooks/use-markets";
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

const PROVINCE_OPTIONS = PROVINCES.map((p) => ({ value: p.name, label: p.name }));

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
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();

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
      provinceName: "",
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
        provinceName: existing.provinceName ?? "",
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
  const provinceName = watch("provinceName");
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

  const [focusClient, setFocusClient] = useState<Client | null>(null);
  const [marketDialogOpen, setMarketDialogOpen] = useState(false);

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

  const onSubmit = async (values: RouteFormValues) => {
    if (isEdit && id) {
      await updateRoute.mutateAsync({ id, input: values });
    } else {
      await createRoute.mutateAsync(values);
    }
    navigate("/routes");
  };

  if (isEdit && loadingRoute) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Skeleton className="h-[520px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <Skeleton className="h-[520px]" />
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

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* ---- Form column (scrollable) ---- */}
        <div className="space-y-4 overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Código de ruta</Label>
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
                      onChange={field.onChange}
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
                <Label htmlFor="provinceName">Provincia</Label>
                <Combobox
                  id="provinceName"
                  options={PROVINCE_OPTIONS}
                  value={provinceName}
                  onChange={(v) => setValue("provinceName", v, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Selecciona una provincia"
                  searchPlaceholder="Buscar provincia…"
                  invalid={!!errors.provinceName}
                />
                <FieldError message={errors.provinceName?.message} />
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
                    {assignedMarkets.map((m) => (
                      <li key={m.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
                        <ColorDot color={m.color} className="h-3.5 w-3.5" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.provinceName ?? "—"} · {m.blockIds.length} manzanos
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyMarkets(marketIds.filter((id) => id !== m.id))}
                          className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Quitar ${m.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <SelectedClientsSection subcanalIds={subcanalIds} blockIds={blockIds} clients={clients} onClientClick={setFocusClient} />
        </div>

        {/* ---- Manzano selector column ---- */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapIcon className="h-4 w-4" />
              Selecciona los manzanos que componen la ruta
            </span>
            <FieldError message={errors.blockIds?.message} />
          </div>
          <div className="h-[460px] lg:h-[calc(100%-2rem)]">
            <RouteMapSelector value={blockIds} onToggle={toggleBlock} subcanalIds={subcanalIds} focusClient={focusClient} blockColors={marketBlockColors} />
          </div>
        </div>
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
