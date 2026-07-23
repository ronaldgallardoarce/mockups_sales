import { z } from "zod";

export const clientTaskSchema = z
  .object({
    name: z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(60, "Máximo 60 caracteres"),
    description: z.string().max(300, "Máximo 300 caracteres").default(""),
    type: z.enum(["foto", "texto", "checklist", "calificacion"]),
    checklistItems: z.array(z.string()).default([]),
    color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color inválido"),
    order: z.number().min(1, "El orden debe ser al menos 1"),
    required: z.boolean(),
    status: z.enum(["active", "inactive"]),
    dueDate: z.string().optional().default(""),
    assignScope: z.enum(["all", "some"]),
    clientIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "checklist") {
      const items = data.checklistItems.filter((i) => i.trim() !== "");
      if (items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checklistItems"],
          message: "Agrega al menos un ítem al checklist",
        });
      }
    }
    if (data.assignScope === "some" && data.clientIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientIds"],
        message: "Selecciona al menos un cliente",
      });
    }
  });

export type ClientTaskFormValues = z.infer<typeof clientTaskSchema>;
