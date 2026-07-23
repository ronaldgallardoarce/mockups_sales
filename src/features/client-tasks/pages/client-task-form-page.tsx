import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import type { ClientTaskInput } from "@/types";
import { ALL_CLIENT_TASK_TYPES, CLIENT_TASK_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { clientTaskSchema, type ClientTaskFormValues } from "../client-task-schema";
import {
  useClientTask,
  useCreateClientTask,
  useUpdateClientTask,
} from "@/hooks/use-client-tasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/common/color-picker";
import { PageHeader } from "@/components/common/page-header";
import { ChecklistItemsEditor } from "../components/checklist-items-editor";
import { ClientPicker } from "../components/client-picker";
import { ClientTaskPreview } from "../components/client-task-preview";

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 300;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function ClientTaskFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading: loadingTask } = useClientTask(id ? Number(id) : undefined);
  const createTask = useCreateClientTask();
  const updateTask = useUpdateClientTask();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientTaskFormValues>({
    resolver: zodResolver(clientTaskSchema),
    defaultValues: {
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
    },
  });

  // Hydrate the form when editing.
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description,
        type: existing.type,
        checklistItems: existing.checklistItems,
        color: existing.color,
        order: existing.order,
        required: existing.required,
        status: existing.status,
        assignScope: existing.assignScope,
        clientIds: existing.clientIds,
      });
    }
  }, [existing, reset]);

  const name = watch("name");
  const description = watch("description");
  const type = watch("type");
  const checklistItems = watch("checklistItems");
  const color = watch("color");
  const order = watch("order");
  const required = watch("required");
  const status = watch("status");
  const assignScope = watch("assignScope");
  const clientIds = watch("clientIds");

  const onSubmit = async (values: ClientTaskFormValues) => {
    const input: ClientTaskInput = { ...values };
    if (isEdit && id) {
      await updateTask.mutateAsync({ id: Number(id), input });
    } else {
      await createTask.mutateAsync(input);
    }
    navigate("/client-tasks");
  };

  if (isEdit && loadingTask) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[160px]" />
            <Skeleton className="h-[220px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PageHeader
        title={isEdit ? "Editar tarea" : "Nueva tarea"}
        description={
          isEdit
            ? "Actualiza los datos de la tarea por cliente."
            : "Define una tarea recurrente y previsualiza cómo se verá en la ficha del cliente."
        }
      >
        <Button type="button" variant="outline" onClick={() => navigate("/client-tasks")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Guardar cambios" : "Crear"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---- Form column (scrollable) ---- */}
        <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
          {/* Datos básicos */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datos básicos
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Nombre de la tarea</Label>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {name?.length ?? 0}/{NAME_MAX_LENGTH}
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        id="name"
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
                  <Label>Tipo de respuesta</Label>
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

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Descripción</Label>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {description?.length ?? 0}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <textarea
                        id="description"
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

                {type === "checklist" && (
                  <div className="space-y-2 sm:col-span-2">
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
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Configuración
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                <div className="space-y-2">
                  <Label htmlFor="order">Orden</Label>
                  <Controller
                    control={control}
                    name="order"
                    render={({ field }) => (
                      <Input
                        id="order"
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                      />
                    )}
                  />
                  <FieldError message={errors.order?.message} />
                </div>

                <div className="space-y-2">
                  <Label>Obligatoria</Label>
                  <div className="flex h-9 items-center gap-3 rounded-md border px-3">
                    <Switch
                      id="required"
                      checked={required}
                      onCheckedChange={(v) => setValue("required", v, { shouldDirty: true })}
                    />
                    <Label htmlFor="required" className="cursor-pointer font-normal">
                      {required ? "Sí" : "No"}
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex h-9 items-center gap-3 rounded-md border px-3">
                    <Switch
                      id="status"
                      checked={status === "active"}
                      onCheckedChange={(v) =>
                        setValue("status", v ? "active" : "inactive", { shouldDirty: true })
                      }
                      disabled={!isEdit}
                    />
                    <Label htmlFor="status" className="cursor-pointer font-normal">
                      {status === "active" ? "Activa" : "Inactiva"}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asignación */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Asignación
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "all", label: "Todos los clientes" },
                    { value: "some", label: "Algunos clientes" },
                  ] as const
                ).map((opt) => {
                  const active = assignScope === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("assignScope", opt.value, { shouldValidate: true, shouldDirty: true })}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {assignScope === "some" && (
                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="clientIds"
                    render={({ field }) => (
                      <ClientPicker selected={field.value} onChange={field.onChange} />
                    )}
                  />
                  <FieldError message={errors.clientIds?.message} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- Live preview column (sticky) ---- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <ClientTaskPreview
                name={name}
                description={description}
                type={type}
                checklistItems={checklistItems}
                color={color}
                order={order}
                required={required}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
