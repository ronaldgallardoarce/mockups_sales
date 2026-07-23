import { useEffect, useMemo, useState } from "react";
import { Check, Search, Users } from "lucide-react";
import type { SellerStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useAllSellers } from "@/hooks/use-sellers";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/common/pagination";
import { SellerStatusBadge } from "@/features/sellers/components/seller-status-badge";

interface SellerPickerProps {
  selected: number[];
  onChange: (codes: number[]) => void;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const SELLERS_PER_PAGE = 8;

export function SellerPicker({ selected, onChange }: SellerPickerProps) {
  const { data: sellers = [] } = useAllSellers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SellerStatus | "all">("ACTIVO");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sellers.filter(
      (s) =>
        (status === "all" || s.status === status) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          String(s.code).includes(q) ||
          s.email.toLowerCase().includes(q)),
    );
  }, [sellers, query, status]);

  useEffect(() => setPage(1), [query, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / SELLERS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * SELLERS_PER_PAGE, safePage * SELLERS_PER_PAGE);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (code: number) => {
    if (selectedSet.has(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border bg-muted/20">
      <div className="space-y-2 border-b p-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Vendedores
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            {selected.length} seleccionados
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar vendedor…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as SellerStatus | "all")}>
            <SelectTrigger className="h-8 w-28 shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVO">Activos</SelectItem>
              <SelectItem value="INACTIVO">Inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="max-h-72 min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <li className="py-8 text-center text-xs text-muted-foreground">Sin vendedores.</li>
        ) : (
          pageItems.map((s) => {
            const isSelected = selectedSet.has(s.code);
            return (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => toggle(s.code)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs shadow-sm transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "hover:border-primary/40",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate font-medium">{s.name}</span>
                      <span className="shrink-0">
                        <SellerStatusBadge status={s.status} />
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">{s.email}</div>
                  </div>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {totalPages > 1 && (
        <div className="border-t p-2">
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
