import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MapPinned,
  Phone,
  Plus,
  Save,
  Users,
  X,
} from "lucide-react";
import type { Route } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChannelBadge, ColorDot } from "@/components/common/channel-badge";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { useEmployee, useUpdateEmployeeRoutes } from "@/hooks/use-employees";
import { useRoutes } from "@/hooks/use-routes";
import { groupSubcanalesByChannel, getChannel, getSubcanal } from "@/data/channels";
import { EmployeeCoverageMap } from "../components/employee-coverage-map";
import { RoutePickerDialog } from "../components/route-picker-dialog";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function EmployeeAssignRoutePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useEmployee(id);
  const { data: allRoutes = [] } = useRoutes();
  const updateRoutes = useUpdateEmployeeRoutes();

  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (employee) setRouteIds(employee.routeIds);
  }, [employee]);

  const assignedRoutes = useMemo(
    () => routeIds.map((rid) => allRoutes.find((r) => r.id === rid)).filter((r): r is Route => !!r),
    [routeIds, allRoutes],
  );
  const candidateRoutes = useMemo(
    () => allRoutes.filter((r) => !routeIds.includes(r.id)),
    [allRoutes, routeIds],
  );

  const derivedChannelIds = useMemo(
    () => Array.from(new Set(assignedRoutes.flatMap((r) => r.channelIds))),
    [assignedRoutes],
  );
  const derivedSubcanalIds = useMemo(
    () => Array.from(new Set(assignedRoutes.flatMap((r) => r.subcanalIds))),
    [assignedRoutes],
  );

  const dirty = employee ? !sameSet(routeIds, employee.routeIds) : false;

  const addRoute = (route: Route) => setRouteIds((prev) => [...prev, route.id]);
  const removeRoute = (routeId: string) => setRouteIds((prev) => prev.filter((r) => r !== routeId));

  const handleSave = async () => {
    if (!id) return;
    await updateRoutes.mutateAsync({ id, routeIds });
    navigate("/employees");
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

  if (!employee) {
    return (
      <EmptyState
        icon={Users}
        title="Empleado no encontrado"
        description="Puede que haya sido eliminado."
        action={
          <Button onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-4 w-4" /> Volver a empleados
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={employee.name}
        description={`${employee.role} · ${employee.code}`}
      >
        <Button type="button" variant="outline" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="button" onClick={handleSave} disabled={!dirty || updateRoutes.isPending}>
          {updateRoutes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* ---- Info column ---- */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="text-sm">{initials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{employee.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{employee.code}</p>
                </div>
                <StatusBadge status={employee.status} />
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {employee.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {employee.phone}
                </p>
              </div>
            </CardContent>
          </Card>

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

              {assignedRoutes.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  Este empleado no tiene rutas asignadas.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {assignedRoutes.map((route) => (
                    <li
                      key={route.id}
                      className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm"
                    >
                      <ColorDot color={route.color} />
                      <span className="min-w-0 flex-1 truncate font-medium">{route.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> {route.clientCount}
                      </span>
                      <StatusBadge status={route.status} />
                      <button
                        type="button"
                        onClick={() => removeRoute(route.id)}
                        className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Quitar ${route.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- Coverage map column ---- */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinned className="h-4 w-4" />
            Cobertura por ruta — cada color es la ruta asignada
          </div>
          <div className="h-[460px] lg:h-[calc(100%-2rem)]">
            <EmployeeCoverageMap routes={assignedRoutes} />
          </div>
        </div>
      </div>

      <RoutePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        candidates={candidateRoutes}
        onPick={(route) => addRoute(route)}
      />
    </>
  );
}
