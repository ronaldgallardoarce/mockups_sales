import { useMemo, useState } from "react";
import { List, MapPin, Search, Store, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChannelBadge } from "@/components/common/channel-badge";
import { BaseMap } from "@/features/map/components/base-map";
import { ClientMarkers } from "@/features/map/components/client-markers";
import { FitBounds } from "@/features/map/components/fit-bounds";
import { useClients } from "@/hooks/use-clients";
import { CHANNELS, getSubcanal, getSubcanalesByChannel } from "@/data/channels";
import type { LatLng } from "@/types";

export function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState("");
  const [channelId, setChannelId] = useState<string>("all");
  const [subcanalId, setSubcanalId] = useState<string>("all");

  const subcanales = channelId === "all" ? [] : getSubcanalesByChannel(channelId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q);
      const matchesChannel = channelId === "all" || c.channelId === channelId;
      const matchesSub = subcanalId === "all" || c.subcanalId === subcanalId;
      return matchesQ && matchesChannel && matchesSub;
    });
  }, [clients, search, channelId, subcanalId]);

  const fitPoints = useMemo<LatLng[]>(() => filtered.map((c) => [c.lat, c.lng]), [filtered]);

  return (
    <>
      <PageHeader
        title="Mercados / Clientes"
        description="Puntos de venta distribuidos por canal y subcanal."
      >
        <Badge variant="secondary" className="rounded-md">
          <Users className="mr-1 h-3.5 w-3.5" /> {filtered.length} clientes
        </Badge>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o propietario…"
            className="pl-9"
          />
        </div>
        <Select
          value={channelId}
          onValueChange={(v) => {
            setChannelId(v);
            setSubcanalId("all");
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {CHANNELS.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                {ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subcanalId} onValueChange={setSubcanalId} disabled={channelId === "all"}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Subcanal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los subcanales</SelectItem>
            {subcanales.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="h-4 w-4" /> Mapa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <div className="space-y-2 rounded-xl border bg-card p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Store} title="Sin clientes" description="Ajusta los filtros de búsqueda." />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Propietario</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="hidden lg:table-cell">Subcanal</TableHead>
                    <TableHead className="hidden xl:table-cell">Dirección</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{c.ownerName}</TableCell>
                      <TableCell><ChannelBadge channelId={c.channelId} /></TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {getSubcanal(c.subcanalId)?.name}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">{c.address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <div className="h-[calc(100vh-19rem)] min-h-[420px] overflow-hidden rounded-xl border">
            <BaseMap layerControl>
              <ClientMarkers clients={filtered} />
              <FitBounds points={fitPoints} />
            </BaseMap>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
