import { z } from "zod";

export const routeMacroSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "Máximo 50 caracteres"),
  // Selected route ids (the seed's string ids); converted to numeric ids on submit.
  routeIds: z.array(z.string()).min(1, "Selecciona al menos una ruta"),
});

export type RouteMacroFormValues = z.infer<typeof routeMacroSchema>;
