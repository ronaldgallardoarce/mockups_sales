import { useState } from "react";
import type { DayCode, FrequencyType, RouteFrequency, WeekPosition } from "@/types";
import {
  ALL_DAYS,
  ALL_FREQUENCY_TYPES,
  ALL_WEEKS,
  DAY_LABELS,
  FREQUENCY_TYPE_LABELS,
  WEEK_LABELS,
} from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface FrequencyEditorProps {
  value: RouteFrequency;
  onApply: (freq: RouteFrequency) => void;
  onCancel?: () => void;
  applyLabel?: string;
}

/**
 * Editable frequency fields (type · weeks · days · validity) shared by the
 * per-route popover and the seller assignment flow. Keeps its own draft state
 * and only emits on apply.
 */
export function FrequencyEditor({ value, onApply, onCancel, applyLabel = "Aplicar" }: FrequencyEditorProps) {
  const [type, setType] = useState<FrequencyType>(value.type);
  const [days, setDays] = useState<DayCode[]>(value.days);
  const [weeks, setWeeks] = useState<WeekPosition[]>(value.weeks.length ? value.weeks : [...ALL_WEEKS]);
  const [from, setFrom] = useState(value.validFrom);
  const [to, setTo] = useState(value.validTo);

  const toggleWeek = (w: WeekPosition) =>
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()));

  const toggleDay = (d: DayCode) =>
    setDays((prev) =>
      prev.includes(d)
        ? prev.filter((x) => x !== d)
        : [...prev, d].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)),
    );

  const daysOk = days.length > 0;
  const weeksOk = type !== "MENSUAL" || weeks.length > 0;
  const datesOk = !!from && !!to && from <= to;
  const valid = daysOk && weeksOk && datesOk;

  const apply = () =>
    onApply({ type, days, weeks: type === "MENSUAL" ? weeks : [], validFrom: from, validTo: to });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo de frecuencia
        </h4>
        <div className="grid grid-cols-3 overflow-hidden rounded-md border text-xs">
          {ALL_FREQUENCY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "px-2 py-1.5 font-medium transition-colors",
                type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {FREQUENCY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {type === "MENSUAL" && (
        <>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Semanas del mes
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_WEEKS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWeek(w)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    weeks.includes(w)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  {WEEK_LABELS[w]}
                </button>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Días de la semana
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              title={DAY_LABELS[d]}
              className={cn(
                "rounded-md border py-1.5 text-xs font-medium transition-colors",
                days.includes(d)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {DAY_LABELS[d].slice(0, 2)}
            </button>
          ))}
        </div>
        {type === "QUINCENAL" && (
          <p className="text-[11px] text-muted-foreground">
            Se repite cada 2 semanas, contando desde la fecha de inicio.
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vigencia</h4>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
            Inicio
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 text-xs"
            />
          </label>
          <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
            Fin
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 text-xs"
            />
          </label>
        </div>
        {!datesOk && from && to && (
          <p className="text-[11px] font-medium text-destructive">
            La fecha de fin debe ser posterior a la de inicio.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="button" size="sm" onClick={apply} disabled={!valid}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}
