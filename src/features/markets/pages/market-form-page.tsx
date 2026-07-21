import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapIcon, Save } from "lucide-react";
import { marketSchema, type MarketFormValues } from "../market-schema";
import { CITIES, DEPARTMENT_NAME, provinceForCity } from "@/data/locations";
import { useCreateMarket, useMarket, useUpdateMarket } from "@/hooks/use-markets";
import { useRole, canEditMarkets } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/common/color-picker";
import { PageHeader } from "@/components/common/page-header";
import { MarketMapSelector } from "../components/market-map-selector";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

const CITY_OPTIONS = CITIES.map((c) => ({ value: c.name, label: c.name }));

export function MarketFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const role = useRole();

  const { data: existing, isLoading: loadingMarket } = useMarket(id);
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MarketFormValues>({
    resolver: zodResolver(marketSchema),
    defaultValues: { name: "", color: "#264bc5", status: "active", cityName: "", blockIds: [] },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        color: existing.color,
        status: existing.status,
        cityName: existing.cityName ?? "",
        blockIds: existing.blockIds,
      });
    }
  }, [existing, reset]);

  const blockIds = watch("blockIds");
  const cityName = watch("cityName");
  const status = watch("status");

  // Only administrators may create/edit markets.
  if (!canEditMarkets(role)) return <Navigate to="/markets" replace />;

  const toggleBlock = (blockId: string) => {
    const next = blockIds.includes(blockId)
      ? blockIds.filter((b) => b !== blockId)
      : [...blockIds, blockId];
    setValue("blockIds", next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: MarketFormValues) => {
    // Province/department are derived from the selected city.
    const input = {
      ...values,
      departmentName: DEPARTMENT_NAME,
      provinceName: provinceForCity(values.cityName),
    };
    if (isEdit && id) await updateMarket.mutateAsync({ id, input });
    else await createMarket.mutateAsync(input);
    navigate("/markets");
  };

  if (isEdit && loadingMarket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[calc(100vh-18rem)] min-h-[440px] w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PageHeader
        title={isEdit ? "Editar mercado" : "Nuevo mercado"}
        description={
          isEdit
            ? "Actualiza los datos y los manzanos del mercado."
            : "Define un mercado y selecciona sus manzanos en el mapa."
        }
      >
        <Button type="button" variant="outline" onClick={() => navigate("/markets")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Guardar cambios" : "Crear mercado"}
        </Button>
      </PageHeader>

      {/* Compact form bar — the map gets the full width below. */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="name">Nombre del mercado</Label>
            <Input id="name" placeholder="Ej. Mercado Central" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-1.5 sm:w-60">
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
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
            />
            <FieldError message={errors.color?.message} />
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <div className="flex h-9 items-center gap-2 rounded-md border px-3">
              <Switch
                id="status"
                checked={status === "active"}
                onCheckedChange={(v) => setValue("status", v ? "active" : "inactive", { shouldDirty: true })}
                disabled={!isEdit}
              />
              <Label htmlFor="status" className="cursor-pointer font-normal">
                {status === "active" ? "Activo" : "Inactivo"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map — full width, tall */}
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <MapIcon className="h-4 w-4" />
          Selecciona los manzanos del mercado
        </span>
        <FieldError message={errors.blockIds?.message} />
      </div>
      <div className="h-[calc(100vh-18rem)] min-h-[440px]">
        <MarketMapSelector value={blockIds} onToggle={toggleBlock} canDraw />
      </div>
    </form>
  );
}
