import { useEffect, useMemo, useState } from "react";
import { Check, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/use-clients";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/common/pagination";

interface ClientPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const CLIENTS_PER_PAGE = 8;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Searchable, paginated, checkable list of clients for the "some clients" scope. */
export function ClientPicker({ selected, onChange }: ClientPickerProps) {
  const { data: clients = [] } = useClients();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q),
    );
  }, [clients, query]);

  useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CLIENTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * CLIENTS_PER_PAGE, safePage * CLIENTS_PER_PAGE);

  const selectedSet = new Set(selected);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border bg-muted/20">
      <div className="space-y-2 border-b p-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Clientes
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            {selected.length} seleccionados
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <ul className="max-h-72 min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {pageItems.length === 0 ? (
          <li className="py-8 text-center text-xs text-muted-foreground">Sin clientes.</li>
        ) : (
          pageItems.map((c) => {
            const isSelected = selectedSet.has(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs shadow-sm transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate font-medium">{c.name}</span>
                      <span className="shrink-0 rounded-full border px-1 py-px text-[10px] font-medium text-muted-foreground">
                        {c.code}
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">{c.ownerName}</div>
                  </div>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
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
