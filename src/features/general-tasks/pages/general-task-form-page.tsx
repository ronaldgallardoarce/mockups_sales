import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import type { GeneralTaskInput, GeneralTaskResponseType } from "@/types";
import { ALL_GENERAL_TASK_RESPONSE_TYPES, ALL_TASK_PRIORITIES, GENERAL_TASK_RESPONSE_TYPE_LABELS, TASK_PRIORITY_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { generalTaskSchema, type GeneralTaskFormValues } from "../general-task-schema";
import {
  useCreateGeneralTask,
  useGeneralTask,
  useUpdateGeneralTask,
} from "@/hooks/use-general-tasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/common/color-picker";
import { PageHeader } from "@/components/common/page-header";
import { ChecklistItemsEditor } from "../components/checklist-items-editor";
import { SellerPicker } from "../components/seller-picker";
import { GeneralTaskPreview } from "../components/general-task-preview";

const DEFAULT_VALUES: GeneralTaskFormValues = {
  title: "",
  description: "",
  responseType: "foto",
  checklistItems: [],
  priority: "normal",
  color: "#264bc5",
  dueDate: "",
  status: "active",
  assignScope: "all",
  sellerCodes: [],
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
        {children}
      </CardContent>
    </Card>
  );
}

export function GeneralTaskFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading: loadingTask } = useGeneralTask(id ? Number(id) : undefined);
  const createTask = useCreateGeneralTask();
  const updateTask = useUpdateGeneralTask();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GeneralTaskFormValues>({
    resolver: zodResolver(generalTaskSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Hydrate the form when editing.
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        responseType: existing.responseType,
        checklistItems: existing.checklistItems,
        priority: existing.priority,
        color: existing.color,
        dueDate: existing.dueDate ?? "",
        status: existing.status,
        assignScope: existing.assignScope,
        sellerCodes: existing.sellerCodes,
      });
    }
  }, [existing, reset]);

  const title = watch("title");
  const description = watch("description");
  const responseType = watch("responseType");
  const checklistItems = watch("checklistItems");
  const priority = watch("priority");
  const color = watch("color");
  const dueDate = watch("dueDate");
  const status = watch("status");
  const assignScope = watch("assignScope");

  const onSubmit = async (values: GeneralTaskFormValues) => {
    const input: GeneralTaskInput = {
      title: values.title,
      description: values.description ?? "",
      responseType: values.responseType,
      checklistItems:
        values.responseType === "checklist"
          ? values.checklistItems.filter((i) => i.trim() !== "")
          : [],
      priority: values.priority,
      color: values.color,
      dueDate: values.dueDate ? values.dueDate : undefined,
      status: values.status,
      assignScope: values.assignScope,
      sellerCodes: values.assignScope === "some" ? values.sellerCodes : [],
    };
    if (isEdit && id) {
      await updateTask.mutateAsync({ id: Number(id), input });
    } else {
      await createTask.mutateAsync(input);
    }
    navigate("/general-tasks");
  };

  if (isEdit && loadingTask) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-72" />
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
            ? "Actualiza los datos de la tarea general."
            : "Define una tarea general y previsualiza cómo se verá para los vendedores."
        }
      >
        <Button type="button" variant="outline" onClick={() => navigate("/general-tasks")}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---- Form column (scrollable) ---- */}
        <div className="space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
          <SectionCard title="Datos básicos">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <Input id="title" placeholder="Título de la tarea" {...field} />
                  )}
                />
                <FieldError message={errors.title?.message} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de respuesta</Label>
                <Controller
                  control={control}
                  name="responseType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as GeneralTaskResponseType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_GENERAL_TASK_RESPONSE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {GENERAL_TASK_RESPONSE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Instrucciones o contexto de la tarea (opcional)"
                      className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  )}
                />
                <FieldError message={errors.description?.message} />
              </div>
              {responseType === "checklist" && (
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
          </SectionCard>

          <SectionCard title="Configuración">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {TASK_PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
                />
                <FieldError message={errors.color?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <Input id="dueDate" type="date" value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
                <FieldError message={errors.dueDate?.message} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex h-9 items-center gap-3 rounded-md border px-3">
                  <Switch
                    checked={status === "active"}
                    onCheckedChange={(v) =>
                      setValue("status", v ? "active" : "inactive", { shouldDirty: true })
                    }
                    disabled={!isEdit}
                    id="status"
                  />
                  <Label htmlFor="status" className="cursor-pointer font-normal">
                    {status === "active" ? "Activa" : "Inactiva"}
                  </Label>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Asignación">
            <Controller
              control={control}
              name="assignScope"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "some"] as const).map((scope) => {
                    const active = field.value === scope;
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => field.onChange(scope)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Users className="h-4 w-4" />
                        {scope === "all" ? "Todos los vendedores" : "Algunos vendedores"}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {assignScope === "some" && (
              <div className="space-y-2">
                <Controller
                  control={control}
                  name="sellerCodes"
                  render={({ field }) => (
                    <SellerPicker selected={field.value} onChange={field.onChange} />
                  )}
                />
                <FieldError message={errors.sellerCodes?.message} />
              </div>
            )}
          </SectionCard>
        </div>

        {/* ---- Live preview (sticky) ---- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <GeneralTaskPreview
            title={title}
            description={description}
            responseType={responseType}
            checklistItems={checklistItems}
            priority={priority}
            color={color}
            dueDate={dueDate}
          />
        </div>
      </div>
    </form>
  );
}
