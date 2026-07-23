import type { LucideIcon } from "lucide-react";
import { Camera, ListChecks, PackageX, Star, Tag, Type } from "lucide-react";
import type { ClientTaskType } from "@/types";
import { CLIENT_TASK_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<ClientTaskType, LucideIcon> = {
  foto: Camera,
  texto: Type,
  checklist: ListChecks,
  calificacion: Star,
  precio_competencia: Tag,
  inventario_faltante: PackageX,
};

export function ClientTaskTypeBadge({
  type,
  className,
}: {
  type: ClientTaskType;
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
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {CLIENT_TASK_TYPE_LABELS[type]}
    </span>
  );
}
