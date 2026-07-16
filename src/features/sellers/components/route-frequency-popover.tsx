import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DayCode, RouteFrequency, WeekPosition } from "@/types";
import {
  ALL_DAYS,
  ALL_WEEKS,
  DAY_LABELS,
  WEEK_LABELS,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Summarize frequency to a short chip label, e.g. "1ra, 3ra sem · Ma, Ju". */
export function summarizeFrequency(f: RouteFrequency): string {
  if (f.weeks.length === 0 || f.days.length === 0) return "Sin configurar";
  const weekPart =
    f.weeks.length === 4
      ? "Todas las sem"
      : f.weeks.map((w) => WEEK_LABELS[w].replace(" semana", "")).join(", ") + " sem";
  const dayPart = f.days.map((d) => DAY_LABELS[d].slice(0, 2)).join(", ");
  return `${weekPart} · ${dayPart}`;
}

interface RouteFrequencyPopoverProps {
  value: RouteFrequency;
  onChange: (freq: RouteFrequency) => void;
  routeColor?: string;
}

export function RouteFrequencyPopover({
  value,
  onChange,
  routeColor,
}: RouteFrequencyPopoverProps) {
  const [open, setOpen] = useState(false);
  const [localWeeks, setLocalWeeks] = useState<WeekPosition[]>(value.weeks);
  const [localDays, setLocalDays] = useState<DayCode[]>(value.days);

  const toggleWeek = (w: WeekPosition) => {
    setLocalWeeks((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort(),
    );
  };

  const toggleDay = (d: DayCode) => {
    setLocalDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const apply = () => {
    onChange({ weeks: localWeeks, days: localDays });
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalWeeks(value.weeks);
      setLocalDays(value.days);
    }
    setOpen(nextOpen);
  };

  const valid = localWeeks.length > 0 && localDays.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          style={
            routeColor
              ? { borderColor: `${routeColor}44`, backgroundColor: `${routeColor}0A` }
              : undefined
          }
        >
          <CalendarDays className="h-3 w-3" />
          {summarizeFrequency(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Semanas del mes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ALL_WEEKS.map((w) => (
                <label
                  key={w}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={localWeeks.includes(w)}
                    onCheckedChange={() => toggleWeek(w)}
                  />
                  {WEEK_LABELS[w]}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Días de la semana
            </h4>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    localDays.includes(d)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {DAY_LABELS[d].slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={apply}
              disabled={!valid}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
