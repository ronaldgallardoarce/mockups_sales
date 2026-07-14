import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Grid3x3, Route as RouteIcon, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { StatusBadge } from "@/features/routes/components/status-badge";
import { BaseMap } from "@/features/map/components/base-map";
import { BlockPolygons } from "@/features/map/components/block-polygons";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { StatCard } from "../components/stat-card";
import { ClientsByChannelChart } from "../components/clients-by-channel-chart";
import { useRoutes } from "@/hooks/use-routes";
import { useClients } from "@/hooks/use-clients";
import { useBlocksStore } from "@/stores/blocks-store";
import { formatDate } from "@/lib/utils";

export function DashboardPage() {
  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const blocks = useBlocksStore((s) => s.blocks);

  const activeRoutes = useMemo(() => routes.filter((r) => r.status === "active").length, [routes]);
  const recent = useMemo(
    () =>
      [...routes]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 5),
    [routes],
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen del microservicio de gestión de rutas de pre-venta."
      >
        <Button asChild>
          <Link to="/routes/new">
            <RouteIcon className="h-4 w-4" /> Nueva ruta
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rutas totales"
          value={routes.length}
          icon={RouteIcon}
          accent="#264bc5"
          hint="Rutas de pre-venta registradas"
          loading={loadingRoutes}
        />
        <StatCard
          label="Rutas activas"
          value={activeRoutes}
          icon={CheckCircle2}
          accent="#10b981"
          hint={`${routes.length - activeRoutes} inactivas`}
          loading={loadingRoutes}
        />
        <StatCard
          label="Clientes"
          value={clients.length}
          icon={Users}
          accent="#06b6d4"
          hint="Puntos de venta mapeados"
          loading={loadingClients}
        />
        <StatCard
          label="Manzanos"
          value={blocks.length}
          icon={Grid3x3}
          accent="#f59e0b"
          hint="Polígonos dibujados"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Clientes por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientsByChannelChart clients={clients} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Cobertura del territorio</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/map">
                Ver mapa <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-72 overflow-hidden rounded-lg border">
              <BaseMap layerControl={false}>
                <BlockPolygons blocks={blocks} />
                <ClientMarkers clients={clients} />
              </BaseMap>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Rutas recientes</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/routes">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {loadingRoutes
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            : recent.map((route) => (
                <Link
                  key={route.id}
                  to={`/routes/${route.id}/edit`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                >
                  <ColorDot color={route.color} className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate text-sm font-medium">{route.name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {route.clientCount} clientes
                  </span>
                  <span className="hidden text-xs text-muted-foreground md:inline">
                    {formatDate(route.startDate)}
                  </span>
                  <StatusBadge status={route.status} />
                </Link>
              ))}
        </CardContent>
      </Card>
    </>
  );
}
