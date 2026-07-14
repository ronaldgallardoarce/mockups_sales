import { z } from "zod";

export const routeSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(60, "Máximo 60 caracteres"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color inválido"),
  status: z.enum(["active", "inactive"]),
  channelIds: z.array(z.string()).min(1, "Selecciona al menos un canal de venta"),
  subcanalIds: z.array(z.string()).min(1, "Selecciona al menos un subcanal"),
  blockIds: z.array(z.string()).min(1, "Selecciona al menos un manzano en el mapa"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
});

export type RouteFormValues = z.infer<typeof routeSchema>;
