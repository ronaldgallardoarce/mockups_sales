import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinned, Pencil, Plus, Search, Store, Trash2 } from "lucide-react";
import type { Market } from "@/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorDot } from "@/components/common/channel-badge";
import { useMarkets, useDeleteMarket } from "@/hooks/use-markets";
import { useRole, canEditMarkets } from "@/stores/session-store";
import { MarketsOverviewMap } from "../components/markets-overview-map";

export function MarketsListPage() {
  const navigate = useNavigate();
  const role = useRole();
  const canEdit = canEditMarkets(role);
  const { data: markets = [], isLoading } = useMarkets();
  const deleteMarket = useDeleteMarket();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Market | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markets.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [markets, search]);

  return (
    <>
      <PageHeader
        title="Gestión de Mercados"
        description={
          canEdit
            ? "Dibuja y administra los mercados y sus manzanos."
            : "Consulta los mercados con sus manzanos y clientes."
        }
      >
        {canEdit && (
          <Button onClick={() => navigate("/markets/new")}>
            <Plus className="h-4 w-4" /> Nuevo mercado
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ---- Markets list ---- */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar mercado…"
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Store}
              title={search ? "Sin resultados" : "Aún no hay mercados"}
              description={
                search
                  ? "Ajusta la búsqueda."
                  : canEdit
                    ? "Crea tu primer mercado para empezar."
                    : "Todavía no se dibujaron mercados."
              }
              action={
                !search && canEdit ? (
                  <Button onClick={() => navigate("/markets/new")}>
                    <Plus className="h-4 w-4" /> Nuevo mercado
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((market) => (
                <li
                  key={market.id}
                  onMouseEnter={() => setSelected(market.id)}
                  onMouseLeave={() => setSelected((s) => (s === market.id ? null : s))}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    selected === market.id && "border-primary/40 bg-primary/5",
                  )}
                >
                  <ColorDot color={market.color} className="h-3.5 w-3.5" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{market.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{market.provinceName ?? "—"}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{market.blockIds.length} manzanos</span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => navigate(`/markets/${market.id}/edit`)}
                        className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={`Editar ${market.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(market)}
                        className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${market.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---- Overview map ---- */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-8rem)]">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinned className="h-4 w-4" />
            Mercados con sus manzanos y clientes
          </div>
          <div className="h-[460px] lg:h-[calc(100%-2rem)]">
            <MarketsOverviewMap markets={filtered} highlightedId={selected} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar “${toDelete?.name}”?`}
        description="Esta acción no se puede deshacer. El mercado será eliminado permanentemente."
        confirmLabel="Eliminar"
        destructive
        loading={deleteMarket.isPending}
        onConfirm={() => {
          if (toDelete) {
            deleteMarket.mutate(toDelete.id);
            setToDelete(null);
          }
        }}
      />
    </>
  );
}
