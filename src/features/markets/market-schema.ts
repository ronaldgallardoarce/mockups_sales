import { z } from "zod";

export const marketSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(60, "Máximo 60 caracteres"),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color inválido"),
  provinceName: z.string().min(1, "Selecciona una provincia"),
  blockIds: z.array(z.string()).min(1, "Selecciona al menos un manzano en el mapa"),
});

export type MarketFormValues = z.infer<typeof marketSchema>;
