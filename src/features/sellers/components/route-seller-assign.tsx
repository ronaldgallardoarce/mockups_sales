import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { RouteFrequency, Seller, SellerStatus } from "@/types";
import { ALL_WEEKS, WEEKDAY_DAYS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/common/pagination";
import { SellerStatusBadge } from "./seller-status-badge";
import { FrequencyEditor } from "./frequency-editor";
import { summarizeFrequency } from "./route-frequency-popover";
import { frequenciesOverlap } from "../lib/route-conflicts";

/** A seller assigned to the route being edited, with the frequency for it. */
export interface RouteSellerAssignment {
  sellerCode: number;
  frequency: RouteFrequency;
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const NEXT_YEAR_ISO = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();
const defaultFrequency = (): RouteFrequency => ({
  type: "SEMANAL",
  days: [...WEEKDAY_DAYS],
  weeks: [...ALL_WEEKS],
  validFrom: TODAY_ISO,
  validTo: NEXT_YEAR_ISO,
});

const PICKER_PAGE_SIZE = 6;

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

interface RouteSellerAssignProps {
  sellers: Seller[];
  value: RouteSellerAssignment[];
  onChange: (next: RouteSellerAssignment[]) => void;
}

/**
 * Assign sellers (each with a visit frequency) to the route being created/edited.
 * A single dialog switches between the seller list and the frequency step.
 * Front-end rule: two sellers on the same route can't share an overlapping
 * frequency. The manzano/channel overlap across a seller's OTHER routes is
 * validated by the backend on save.
 */
export function RouteSellerAssign({ sellers, value, onChange }: RouteSellerAssignProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "all">("ACTIVO");
  const [page, setPage] = useState(1);
  /** When set, the dialog shows the frequency step for this seller; else the list. */
  const [freqFor, setFreqFor] = useState<number | null>(null);

  const sellerByCode = useMemo(() => new Map(sellers.map((s) => [s.code, s])), [sellers]);
  const assignedCodes = new Set(value.map((v) => v.sellerCode));

  const q = query.trim().toLowerCase();
  const available = useMemo(
    () =>
      sellers.filter(
        (s) =>
          !assignedCodes.has(s.code) &&
          (statusFilter === "all" || s.status === statusFilter) &&
          (!q ||
            s.name.toLowerCase().includes(q) ||
            String(s.code).includes(q) ||
            s.email.toLowerCase().includes(q)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sellers, value, statusFilter, q],
  );

  useEffect(() => setPage(1), [q, statusFilter, open]);
  const totalPages = Math.max(1, Math.ceil(available.length / PICKER_PAGE_SIZE));
  const pg = Math.min(page, totalPages);
  const pageItems = available.slice((pg - 1) * PICKER_PAGE_SIZE, pg * PICKER_PAGE_SIZE);

  const openPicker = () => {
    setFreqFor(null);
    setQuery("");
    setOpen(true);
  };

  const currentFreq =
    freqFor != null ? value.find((v) => v.sellerCode === freqFor)?.frequency ?? defaultFrequency() : defaultFrequency();

  const applyFreq = (frequency: RouteFrequency) => {
    if (freqFor == null) return;
    // No two sellers on this route may share an overlapping frequency.
    const clash = value.find((v) => v.sellerCode !== freqFor && frequenciesOverlap(v.frequency, frequency));
    if (clash) {
      toast.error("Frecuencia en conflicto", {
        description: `${sellerByCode.get(clash.sellerCode)?.name} ya cubre esa frecuencia en esta ruta. Elegí días distintos.`,
      });
      return;
    }
    const exists = value.some((v) => v.sellerCode === freqFor);
    onChange(
      exists
        ? value.map((v) => (v.sellerCode === freqFor ? { ...v, frequency } : v))
        : [...value, { sellerCode: freqFor, frequency }],
    );
    setOpen(false);
    setFreqFor(null);
  };

  const remove = (code: number) => onChange(value.filter((v) => v.sellerCode !== code));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" /> Vendedores asignados
        </h4>
        <Button type="button" size="sm" variant="outline" onClick={openPicker}>
          <Plus className="h-3.5 w-3.5" /> Asignar vendedor
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
          Ningún vendedor asignado. Se guardan junto con la ruta.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {value.map(({ sellerCode, frequency }) => {
            const s = sellerByCode.get(sellerCode);
            return (
              <li key={sellerCode} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {s ? initials(s.name) : "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s?.name ?? `#${sellerCode}`}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setFreqFor(sellerCode);
                      setOpen(true);
                    }}
                    className="mt-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <CalendarDays className="h-3 w-3" /> {summarizeFrequency(frequency)}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(sellerCode)}
                  className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Quitar ${s?.name ?? "vendedor"}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* One dialog, two steps: seller list ↔ frequency. */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setFreqFor(null);
        }}
      >
        <DialogContent className="max-w-md">
          {freqFor == null ? (
            <>
              <DialogHeader>
                <DialogTitle>Asignar vendedor</DialogTitle>
                <DialogDescription>Elegí un vendedor; luego definís su frecuencia de visita.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar vendedor…"
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SellerStatus | "all")}>
                  <SelectTrigger className="w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activos</SelectItem>
                    <SelectItem value="INACTIVO">Inactivos</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="-mx-1 min-h-[18rem] space-y-1 px-1">
                {pageItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Sin vendedores disponibles.</p>
                ) : (
                  pageItems.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => setFreqFor(s.code)}
                      className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(s.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                      </div>
                      <SellerStatusBadge status={s.status} />
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{available.length} vendedor(es)</span>
                <Pagination page={pg} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Frecuencia de visita</DialogTitle>
                <DialogDescription>{sellerByCode.get(freqFor)?.name}</DialogDescription>
              </DialogHeader>
              <FrequencyEditor
                value={currentFreq}
                onApply={applyFreq}
                onCancel={() => setFreqFor(null)}
                applyLabel="Confirmar"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
