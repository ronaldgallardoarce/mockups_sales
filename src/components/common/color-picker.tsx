import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRESETS = [
  "#264bc5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6", "#0ea5e9", "#64748b",
];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between gap-2 px-2.5 font-normal"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-5 w-5 rounded-md ring-1 ring-black/10"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {PRESETS.map((color) => {
            const active = value.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md ring-offset-2 ring-offset-popover transition-transform hover:scale-110",
                  active && "ring-2 ring-ring",
                )}
                style={{ backgroundColor: color }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-dashed border-input">
            <span
              className="h-full w-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #ef4444, #f59e0b, #10b981, #06b6d4, #264bc5, #ec4899, #ef4444)",
              }}
            />
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Color personalizado"
            />
          </span>
          Color personalizado
        </label>
      </PopoverContent>
    </Popover>
  );
}
