import type { SellerStatus } from "@/types";
import { cn } from "@/lib/utils";

/** Badge for a seller's status ("ACTIVO" / "INACTIVO" as returned by the API). */
export function SellerStatusBadge({ status }: { status: SellerStatus }) {
  const active = status === "ACTIVO";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
