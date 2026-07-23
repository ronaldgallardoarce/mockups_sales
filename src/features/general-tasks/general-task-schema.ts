import { z } from "zod";

export const generalTaskSchema = z
  .object({
    title: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(80, "Máximo 80 caracteres"),
    description: z.string().max(300, "Máximo 300 caracteres").optional().default(""),
    responseType: z.enum([
      "foto",
      "texto",
      "checklist",
      "calificacion",
      "toma_precio",
      "inventario_faltante",
    ]),
    checklistItems: z.array(z.string()).default([]),
    priority: z.enum(["baja", "normal", "alta", "urgente"]),
    color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color inválido"),
    dueDate: z.string().optional().default(""),
    status: z.enum(["active", "inactive"]),
    assignScope: z.enum(["all", "some"]),
    sellerCodes: z.array(z.number()).default([]),
  })
  .superRefine((values, ctx) => {
    if (values.responseType === "checklist") {
      const nonEmpty = values.checklistItems.filter((i) => i.trim() !== "");
      if (nonEmpty.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checklistItems"],
          message: "Agrega al menos un ítem al checklist",
        });
      }
    }
    if (values.assignScope === "some" && values.sellerCodes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sellerCodes"],
        message: "Selecciona al menos un vendedor",
      });
    }
  });

export type GeneralTaskFormValues = z.infer<typeof generalTaskSchema>;
