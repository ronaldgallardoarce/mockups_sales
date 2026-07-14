import { cn } from "@/lib/utils";
import { channelColor, getChannel } from "@/data/channels";

/** Small solid color swatch. */
export function ColorDot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10", className)}
      style={{ backgroundColor: color }}
    />
  );
}

/** Channel chip with its canonical color — used across list / form / map. */
export function ChannelBadge({
  channelId,
  className,
}: {
  channelId: string;
  className?: string;
}) {
  const channel = getChannel(channelId);
  const color = channelColor(channelId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {channel?.name ?? channelId}
    </span>
  );
}
