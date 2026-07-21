import { useState } from "react";
import { CalendarDays, CalendarRange } from "lucide-react";
import type { RouteFrequency } from "@/types";
import { DAY_LABELS, FREQUENCY_TYPE_LABELS, WEEK_LABELS } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FrequencyEditor } from "./frequency-editor";

/** dd/mm/yy from a YYYY-MM-DD string. */
function formatDMY(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

/** Short cadence label, e.g. "Mensual · 1ra, 2da sem · Lu, Mi". */
export function summarizeFrequency(f: RouteFrequency): string {
  if (f.days.length === 0) return "Sin configurar";
  const dayPart = f.days.map((d) => DAY_LABELS[d].slice(0, 2)).join(", ");
  if (f.type === "MENSUAL") {
    if (f.weeks.length === 0) return "Sin configurar";
    const weekPart =
      f.weeks.length === 4
        ? "Todas las sem"
        : f.weeks.map((w) => WEEK_LABELS[w].replace(" semana", "")).join(", ") + " sem";
    return `Mensual · ${weekPart} · ${dayPart}`;
  }
  return `${FREQUENCY_TYPE_LABELS[f.type]} · ${dayPart}`;
}

interface RouteFrequencyPopoverProps {
  value: RouteFrequency;
  onChange: (freq: RouteFrequency) => void;
  routeColor?: string;
}

export function RouteFrequencyPopover({ value, onChange, routeColor }: RouteFrequencyPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col items-start gap-0.5 rounded-md border px-2 py-1 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          style={
            routeColor
              ? { borderColor: `${routeColor}44`, backgroundColor: `${routeColor}0A` }
              : undefined
          }
        >
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {summarizeFrequency(value)}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
            <CalendarRange className="h-2.5 w-2.5 shrink-0" />
            {formatDMY(value.validFrom)} – {formatDMY(value.validTo)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <FrequencyEditor
          value={value}
          onApply={(freq) => {
            onChange(freq);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
