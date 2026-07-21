import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RouteCodeInputProps {
  /** Editable segment value — the route name the user types. */
  value: string;
  onChange: (value: string) => void;
  /** City abbreviation (comes from params). */
  city?: string;
  /** Selected sale channel names; abbreviated and collapsed with +N if many. */
  channels?: string[];
  /** Route id shown in the id segment when editing; otherwise "auto". */
  autoId?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}

/** Two-letter, letters-only abbreviation of a channel name (TRADICIONAL -> TR). */
export function channelAbbr(name: string) {
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

export const MAX_VISIBLE_CHANNELS = 3;

/** Max length of the editable route name. Shared with the form's counter. */
export const ROUTE_NAME_MAX_LENGTH = 20;

/** One read-only gray section of the compound field. */
function Segment({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div
      aria-hidden
      title={title}
      className={cn(
        "flex select-none items-center justify-center border-r bg-muted/60 px-2.5",
        "font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Segmented compound control that reads as a single text field split into
 * sections: [city]-[channels]-[id]-[name]. The first three are read-only; the
 * last is the editable route name. Normal input height, premium finish.
 */
export const RouteCodeInput = forwardRef<HTMLInputElement, RouteCodeInputProps>(
  function RouteCodeInput(
    {
      value,
      onChange,
      city = "SC",
      channels = [],
      autoId,
      maxLength = ROUTE_NAME_MAX_LENGTH,
      placeholder = "Nombre de la ruta",
      disabled,
      invalid,
      id,
    },
    ref,
  ) {
    const visibleChannels = channels.slice(0, MAX_VISIBLE_CHANNELS);
    const restChannels = channels.length - visibleChannels.length;

    return (
      <div
        className={cn(
          "flex h-9 items-stretch overflow-hidden rounded-md border bg-card shadow-sm transition-all duration-150",
          "focus-within:border-ring focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/35",
          invalid && "border-destructive focus-within:border-destructive focus-within:ring-destructive/30",
          disabled && "pointer-events-none opacity-60",
        )}
      >
          <Segment>{city}</Segment>

          <Segment
            title={channels.length ? channels.join(", ") : "Sin canales seleccionados"}
            className="max-w-[7.5rem] gap-1"
          >
            {channels.length === 0 ? (
              <span className="text-muted-foreground/50">—</span>
            ) : (
              <span className="flex items-center gap-1 truncate">
                {visibleChannels.map(channelAbbr).join("·")}
                {restChannels > 0 && (
                  <span className="rounded bg-foreground/10 px-1 text-[10px] font-bold text-foreground/60">
                    +{restChannels}
                  </span>
                )}
              </span>
            )}
          </Segment>

          <Segment className="normal-case text-muted-foreground/70">
            {autoId ?? "auto"}
          </Segment>

          <input
            ref={ref}
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={cn(
              "min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none",
              "placeholder:text-muted-foreground/50 disabled:cursor-not-allowed",
            )}
          />
      </div>
    );
  },
);
