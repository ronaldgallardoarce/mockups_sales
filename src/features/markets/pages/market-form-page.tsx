import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapIcon, Save } from "lucide-react";
import { marketSchema, type MarketFormValues } from "../market-schema";
import { PROVINCES } from "@/data/locations";
import { useCreateMarket, useMarket, useUpdateMarket } from "@/hooks/use-markets";
import { useRole, canEditMarkets } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const PROVINCE_OPTIONS = PROVINCES.map((p) => ({ value: p.name, label: p.name }));

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
    defaultValues: { name: "", color: "#264bc5", provinceName: "", blockIds: [] },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        color: existing.color,
        provinceName: existing.provinceName ?? "",
        blockIds: existing.blockIds,
      });
    }
  }, [existing, reset]);

  const blockIds = watch("blockIds");
  const provinceName = watch("provinceName");

  // Only administrators may create/edit markets.
  if (!canEditMarkets(role)) return <Navigate to="/markets" replace />;

  const toggleBlock = (blockId: string) => {
    const next = blockIds.includes(blockId)
      ? blockIds.filter((b) => b !== blockId)
      : [...blockIds, blockId];
    setValue("blockIds", next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: MarketFormValues) => {
    if (isEdit && id) await updateMarket.mutateAsync({ id, input: values });
    else await createMarket.mutateAsync(values);
    navigate("/markets");
  };

  if (isEdit && loadingMarket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[520px]" />
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4 overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del mercado</Label>
                <Input id="name" placeholder="Ej. Mercado Central" {...register("name")} />
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapIcon className="h-4 w-4" />
              Selecciona los manzanos del mercado
            </span>
            <FieldError message={errors.blockIds?.message} />
          </div>
          <div className="h-[460px] lg:h-[calc(100%-2rem)]">
            <MarketMapSelector value={blockIds} onToggle={toggleBlock} canDraw />
          </div>
        </div>
      </div>
    </form>
  );
}
