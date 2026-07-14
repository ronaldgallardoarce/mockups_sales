import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapIcon, Save } from "lucide-react";
import { routeSchema, type RouteFormValues } from "../route-schema";
import { getSubcanalesByChannel } from "@/data/channels";
import { useChannels } from "@/hooks/use-channels";
import { useClients } from "@/hooks/use-clients";
import { useCreateRoute, useRoute, useUpdateRoute } from "@/hooks/use-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/common/color-picker";
import { PageHeader } from "@/components/common/page-header";
import { ChannelMultiSelect } from "../components/channel-multiselect";
import { SubcanalSelector } from "../components/subcanal-selector";
import { RouteMapSelector } from "../components/route-map-selector";

const today = () => new Date().toISOString().slice(0, 10);

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
  const { data: existing, isLoading: loadingRoute } = useRoute(id);
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();

  const {
    control,
    register,
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
      channelIds: [],
      subcanalIds: [],
      blockIds: [],
      startDate: today(),
    },
  });

  // Hydrate the form when editing.
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        color: existing.color,
        status: existing.status,
        channelIds: existing.channelIds,
        subcanalIds: existing.subcanalIds,
        blockIds: existing.blockIds,
        startDate: existing.startDate.slice(0, 10),
      });
    }
  }, [existing, reset]);

  const channelIds = watch("channelIds");
  const subcanalIds = watch("subcanalIds");
  const blockIds = watch("blockIds");
  const status = watch("status");

  const toggleBlock = (blockId: string) => {
    const next = blockIds.includes(blockId)
      ? blockIds.filter((b) => b !== blockId)
      : [...blockIds, blockId];
    setValue("blockIds", next, { shouldValidate: true, shouldDirty: true });
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Skeleton className="h-[520px]" />
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* ---- Form column ---- */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la ruta</Label>
              <Input id="name" placeholder="Ej. Ruta Centro · Tradicional" {...register("name")} />
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
                    id="status"
                  />
                  <Label htmlFor="status" className="cursor-pointer font-normal">
                    {status === "active" ? "Activa" : "Inactiva"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              <FieldError message={errors.startDate?.message} />
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
            <RouteMapSelector value={blockIds} onToggle={toggleBlock} subcanalIds={subcanalIds} />
          </div>
        </div>
      </div>
    </form>
  );
}
