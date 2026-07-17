import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Grid3x3, Mail, MapPinned, Route as RouteIcon, User, Users } from "lucide-react";
import type { SellerDetailRoute } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColorDot } from "@/components/common/channel-badge";
import { SellerStatusBadge } from "../components/seller-status-badge";
import { SellerRoutesMap } from "../components/seller-routes-map";
import { useSellerDetail } from "@/hooks/use-sellers";
import { formatDate } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function customerCount(route: SellerDetailRoute) {
  return route.blocks.reduce((sum, b) => sum + b.customers.length, 0);
}

export function SellerDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const numericCode = code ? Number(code) : undefined;
  const { data: seller, isLoading } = useSellerDetail(numericCode);

  const totals = useMemo(() => {
    if (!seller) return { routes: 0, blocks: 0, customers: 0 };
    return {
      routes: seller.assignRoutes.length,
      blocks: seller.assignRoutes.reduce((s, r) => s + r.blocks.length, 0),
      customers: seller.assignRoutes.reduce((s, r) => s + customerCount(r), 0),
    };
  }, [seller]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  if (!seller) {
    return (
      <>
        <PageHeader title="Vendedor" description="Detalle del vendedor.">
          <Button variant="outline" onClick={() => navigate("/sellers")}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        </PageHeader>
        <EmptyState
          icon={Users}
          title="Vendedor no encontrado"
          description="No pudimos cargar el detalle de este vendedor."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={seller.name} description="Detalle del vendedor y sus rutas asignadas.">
        <Button variant="outline" onClick={() => navigate("/sellers")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button onClick={() => navigate(`/sellers/${code}/assign`)}>
          <MapPinned className="h-4 w-4" /> Asignar rutas
        </Button>
      </PageHeader>

      {/* Profile */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-base">{initials(seller.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{seller.name}</h2>
              <SellerStatusBadge status={seller.activeFlag ? "ACTIVO" : "INACTIVO"} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {seller.user}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {seller.email}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-xl font-semibold tabular-nums">{totals.routes}</p>
              <p className="text-xs text-muted-foreground">Rutas</p>
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{totals.blocks}</p>
              <p className="text-xs text-muted-foreground">Manzanos</p>
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{totals.customers}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {seller.assignRoutes.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="Sin rutas asignadas"
          description="Este vendedor todavía no tiene rutas asignadas."
          action={
            <Button onClick={() => navigate(`/sellers/${code}/assign`)}>
              <MapPinned className="h-4 w-4" /> Asignar rutas
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Map */}
          <div className="h-[420px] lg:sticky lg:top-20 lg:h-[calc(100vh-9rem)]">
            <SellerRoutesMap routes={seller.assignRoutes} />
          </div>

          {/* Routes + customers */}
          <div className="space-y-4">
            {seller.assignRoutes.map((route) => (
              <Card key={route.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ColorDot color={route.color} className="h-3.5 w-3.5" />
                    <h3 className="min-w-0 flex-1 truncate font-semibold">{route.name}</h3>
                    <SellerStatusBadge status={route.active_flag ? "ACTIVO" : "INACTIVO"} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(route.valid_from)} – {formatDate(route.valid_to)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Grid3x3 className="h-3.5 w-3.5" /> {route.blocks.length} manzanos
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {customerCount(route)} clientes
                    </span>
                    <span>Distribuidor #{route.distributorId}</span>
                  </div>

                  {customerCount(route) > 0 && (
                    <>
                      <Separator />
                      <div className="overflow-hidden rounded-lg border">
                        <Table className="text-[13px] [&_td]:py-2">
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Cliente</TableHead>
                              <TableHead className="hidden sm:table-cell">Subcanal</TableHead>
                              <TableHead className="w-28">Manzano</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {route.blocks.flatMap((block) =>
                              block.customers.map((c) => (
                                <TableRow key={`${block.code}-${c.customerId}`}>
                                  <TableCell className="font-medium">{c.customerName}</TableCell>
                                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                                    {c.subchannelName}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{block.name}</TableCell>
                                </TableRow>
                              )),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
