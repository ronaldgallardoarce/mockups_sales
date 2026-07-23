import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import type { ClientTask, ClientTaskInput } from "@/types";
import { ALL_CLIENT_TASK_TYPES, CLIENT_TASK_TYPE_LABELS } from "@/types";
import { clientTaskSchema, type ClientTaskFormValues } from "../client-task-schema";
import { useCreateClientTask, useUpdateClientTask } from "@/hooks/use-client-tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/common/color-picker";
import { ChecklistItemsEditor } from "./checklist-items-editor";
import { ClientTaskPreview } from "./client-task-preview";

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 300;

const EMPTY_DEFAULTS: ClientTaskFormValues = {
  name: "",
  description: "",
  type: "foto",
  checklistItems: [],
  color: "#264bc5",
  order: 1,
  required: false,
  status: "active",
  assignScope: "all",
  clientIds: [],
};

interface ClientTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task being edited, or null/undefined to create a new one. */
  task?: ClientTask | null;
  /** Order given to a brand-new task (usually max(order) + 1). */
  nextOrder?: number;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

/**
 * Create/edit modal for a per-client task. A single dialog covers both modes:
 * when `task` is set the form hydrates from it (edit), otherwise it starts from
 * defaults (create). Client assignment is handled elsewhere (the map page), so
 * this form keeps the task's scope untouched and never edits `clientIds`.
 */
export function ClientTaskFormDialog({
  open,
  onOpenChange,
  task,
  nextOrder = 1,
}: ClientTaskFormDialogProps) {
  const isEdit = !!task;
  const createTask = useCreateClientTask();
  const updateTask = useUpdateClientTask();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientTaskFormValues>({
    resolver: zodResolver(clientTaskSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // Reset the form each time the dialog opens: hydrate from the task when
  // editing, otherwise fall back to defaults with the computed next order.
  useEffect(() => {
    if (!open) return;
    if (task) {
      reset({
        name: task.name,
        description: task.description,
        type: task.type,
        checklistItems: task.checklistItems,
        color: task.color,
        order: task.order,
        required: task.required,
        status: task.status,
        assignScope: task.assignScope,
        clientIds: task.clientIds,
      });
    } else {
      reset({ ...EMPTY_DEFAULTS, order: nextOrder });
    }
  }, [open, task, nextOrder, reset]);

  const name = watch("name");
  const description = watch("description");
  const type = watch("type");
  const checklistItems = watch("checklistItems");
  const color = watch("color");
  const order = watch("order");
  const required = watch("required");

  const onSubmit = async (values: ClientTaskFormValues) => {
    const input: ClientTaskInput = { ...values };
    if (isEdit && task) {
      await updateTask.mutateAsync({ id: task.id, input });
    } else {
      await createTask.mutateAsync(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos de la tarea por cliente."
              : "Define una tarea recurrente y previsualiza cómo se verá en la ficha del cliente."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="client-task-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid min-h-0 flex-1 gap-5 overflow-y-auto pr-1 md:grid-cols-[minmax(0,1fr)_260px]"
        >
          {/* ---- Fields ---- */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-name">Título de la tarea</Label>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {name?.length ?? 0}/{NAME_MAX_LENGTH}
                </span>
              </div>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Input
                    id="task-name"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ej: Foto de la vitrina"
                    maxLength={NAME_MAX_LENGTH}
                  />
                )}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-description">Descripción</Label>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {description?.length ?? 0}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <textarea
                    id="task-description"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Instrucciones para el vendedor (opcional)"
                    rows={3}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de tarea</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_CLIENT_TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {CLIENT_TASK_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.type?.message} />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  )}
                />
                <FieldError message={errors.color?.message} />
              </div>

              <div className="flex items-end">
                <Controller
                  control={control}
                  name="required"
                  render={({ field }) => (
                    <label className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Obligatoria</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </label>
                  )}
                />
              </div>
            </div>

            {type === "checklist" && (
              <div className="space-y-2">
                <Label>Ítems del checklist</Label>
                <Controller
                  control={control}
                  name="checklistItems"
                  render={({ field }) => (
                    <ChecklistItemsEditor value={field.value} onChange={field.onChange} />
                  )}
                />
                <FieldError message={errors.checklistItems?.message} />
              </div>
            )}
          </div>

          {/* ---- Live preview ---- */}
          <div className="md:border-l md:pl-5">
            <ClientTaskPreview
              name={name}
              description={description}
              type={type}
              checklistItems={checklistItems}
              color={color}
              order={order}
              required={required}
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="client-task-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
