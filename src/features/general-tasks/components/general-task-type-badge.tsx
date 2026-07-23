import { Camera, DollarSign, ListChecks, PackageX, Star, Type, type LucideIcon } from "lucide-react";
import type { GeneralTaskResponseType } from "@/types";
import { GENERAL_TASK_RESPONSE_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<GeneralTaskResponseType, LucideIcon> = {
  foto: Camera,
  texto: Type,
  checklist: ListChecks,
  calificacion: Star,
  toma_precio: DollarSign,
  inventario_faltante: PackageX,
};

export function GeneralTaskTypeBadge({
  type,
  className,
}: {
  type: GeneralTaskResponseType;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {GENERAL_TASK_RESPONSE_TYPE_LABELS[type]}
    </span>
  );
}
