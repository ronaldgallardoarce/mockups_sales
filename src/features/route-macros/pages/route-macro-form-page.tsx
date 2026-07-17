import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Grid3x3, Loader2, Map as MapIcon, Route as RouteIcon, Save, X } from "lucide-react";
import type { Route } from "@/types";
import { routeMacroSchema, type RouteMacroFormValues } from "../route-macro-schema";
import { useRoutes } from "@/hooks/use-routes";
import { useCreateRouteMacro, useRouteMacro, useUpdateRouteMacro } from "@/hooks/use-route-macros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorDot } from "@/components/common/channel-badge";
import { PageHeader } from "@/components/common/page-header";
import { RouteMultiSelect } from "../components/route-multiselect";
import { MacroRoutesMap } from "../components/macro-routes-map";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function RouteMacroFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();
  const { data: existing, isLoading: loadingMacro } = useRouteMacro(id);
  const createMacro = useCreateRouteMacro();
  const updateMacro = useUpdateRouteMacro();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RouteMacroFormValues>({
    resolver: zodResolver(routeMacroSchema),
    defaultValues: {
      name: "",
      status: "active",
      routeIds: [],
    },
  });

  // Hydrate the form when editing.
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        status: existing.status,
        routeIds: existing.routeIds,
      });
    }
  }, [existing, reset]);

  const routeIds = watch("routeIds");
  const status = watch("status");

  const selectedRoutes = useMemo<Route[]>(() => {
    const byId = new Map(routes.map((r) => [r.id, r]));
    return routeIds.map((rid) => byId.get(rid)).filter((r): r is Route => !!r);
  }, [routeIds, routes]);

  const blockCount = useMemo(() => {
    const blocks = new Set<string>();
    selectedRoutes.forEach((r) => r.blockIds.forEach((b) => blocks.add(b)));
    return blocks.size;
  }, [selectedRoutes]);

  const removeRoute = (rid: string) =>
    setValue("routeIds", routeIds.filter((x) => x !== rid), {
      shouldValidate: true,
      shouldDirty: true,
    });

  const onSubmit = async (values: RouteMacroFormValues) => {
    if (isEdit && id) {
      await updateMacro.mutateAsync({ id, input: values });
    } else {
      await createMacro.mutateAsync(values);
    }
    navigate("/route-macros");
  };

  if (isEdit && loadingMacro) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[460px]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PageHeader
        title={isEdit ? "Editar macroruta" : "Nueva macroruta"}
        description={
          isEdit
            ? "Actualiza los datos y las rutas de la macroruta."
            : "Agrupa una o varias rutas y previsualiza su cobertura en el mapa."
        }
      >
        <Button type="button" variant="outline" onClick={() => navigate("/route-macros")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Guardar cambios" : "Crear macroruta"}
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la macroruta</Label>
            <Input id="name" placeholder="Ej. Macro Trinidad Centro" {...register("name")} />
            <FieldError message={errors.name?.message} />
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
        </CardContent>
      </Card>

      <Tabs defaultValue="routes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="routes">
              <RouteIcon className="h-4 w-4" /> Rutas
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="h-4 w-4" /> Mapa
            </TabsTrigger>
          </TabsList>
          <span className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RouteIcon className="h-3.5 w-3.5" /> {selectedRoutes.length} rutas
            </span>
            <span className="inline-flex items-center gap-1">
              <Grid3x3 className="h-3.5 w-3.5" /> {blockCount} manzanos
            </span>
          </span>
        </div>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label>Rutas de la macroruta</Label>
                <RouteMultiSelect
                  routes={routes}
                  value={routeIds}
                  onChange={(ids) =>
                    setValue("routeIds", ids, { shouldValidate: true, shouldDirty: true })
                  }
                  loading={loadingRoutes}
                />
                <FieldError message={errors.routeIds?.message} />
              </div>

              {selectedRoutes.length > 0 && (
                <div className="space-y-1.5">
                  {selectedRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <ColorDot color={route.color} className="h-3 w-3 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-medium">{route.name}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Grid3x3 className="h-3 w-3" /> {route.blockIds.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRoute(route.id)}
                        className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Quitar ${route.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <div className="h-[520px]">
            <MacroRoutesMap routes={selectedRoutes} />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
