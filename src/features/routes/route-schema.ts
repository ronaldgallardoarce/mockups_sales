import { z } from "zod";

export const routeSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(20, "Máximo 20 caracteres"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color inválido"),
  status: z.enum(["active", "inactive"]),
  cityName: z.string().min(1, "Selecciona una ciudad"),
  channelIds: z.array(z.string()).min(1, "Selecciona al menos un canal de venta"),
  subcanalIds: z.array(z.string()).min(1, "Selecciona al menos un subcanal"),
  blockIds: z.array(z.string()).min(1, "Selecciona al menos un manzano en el mapa"),
  marketIds: z.array(z.string()).default([]),
});

export type RouteFormValues = z.infer<typeof routeSchema>;
