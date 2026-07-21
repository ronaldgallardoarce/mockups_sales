import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Grid3x3, Mail, MapPinned, Route as RouteIcon, Store, User, Users } from "lucide-react";
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
      {/* Seller identity lives in the header — no separate profile card. */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base">{initials(seller.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{seller.name}</h1>
              <SellerStatusBadge status={seller.activeFlag ? "ACTIVO" : "INACTIVO"} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {seller.user}
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {seller.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <RouteIcon className="h-3.5 w-3.5" /> {totals.routes} rutas
              </span>
              <span className="inline-flex items-center gap-1">
                <Grid3x3 className="h-3.5 w-3.5" /> {totals.blocks} manzanos
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {totals.customers} clientes
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/sellers")}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
          <Button onClick={() => navigate(`/sellers/${code}/assign`)}>
            <MapPinned className="h-4 w-4" /> Asignar rutas
          </Button>
        </div>
      </div>

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

                  {route.markets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Store className="h-3.5 w-3.5" /> Mercados:
                      </span>
                      {route.markets.map((m) => (
                        <span
                          key={m.name}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                          style={{ color: m.color, borderColor: `${m.color}55`, backgroundColor: `${m.color}14` }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}

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
