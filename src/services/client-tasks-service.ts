import type { ClientTask, ClientTaskInput, ClientTaskType, TaskStatus } from "@/types";
import { SEED_CLIENT_TASKS } from "@/data/seed";
import { delay } from "@/lib/utils";
import type { Paginated } from "./routes-service";

export interface ListClientTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | "all";
  type?: ClientTaskType | "all";
  search?: string;
}

/**
 * In-memory mutable repository standing in for the client-tasks REST resource.
 * Kept module level so mutations survive navigation within the session.
 */
let CLIENT_TASKS: ClientTask[] = [...SEED_CLIENT_TASKS];

export const clientTasksService = {
  list: (): Promise<ClientTask[]> => delay([...CLIENT_TASKS], 500),

  /** Server-style paginated + filtered list (as the real API returns it). */
  listPaged: ({
    page = 1,
    limit = 8,
    status = "all",
    type = "all",
    search = "",
  }: ListClientTasksParams = {}): Promise<Paginated<ClientTask>> => {
    const q = search.trim().toLowerCase();
    const filtered = CLIENT_TASKS.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (type === "all" || t.type === type) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * limit, safePage * limit);
    return delay({ data, pagination: { page: safePage, limit, totalItems, totalPages } }, 450);
  },

  get: (id: number): Promise<ClientTask | undefined> =>
    delay(CLIENT_TASKS.find((t) => t.id === id), 300),

  create: (input: ClientTaskInput): Promise<ClientTask> => {
    const now = new Date().toISOString();
    const nextId = CLIENT_TASKS.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const task: ClientTask = {
      id: nextId,
      name: input.name,
      description: input.description,
      type: input.type,
      checklistItems: input.checklistItems,
      color: input.color,
      order: input.order,
      required: input.required,
      status: input.status ?? "active",
      dueDate: input.dueDate || undefined,
      assignScope: input.assignScope,
      clientIds: input.clientIds,
      createdAt: now,
      updatedAt: now,
    };
    CLIENT_TASKS = [task, ...CLIENT_TASKS];
    return delay(task, 500);
  },

  update: (id: number, input: ClientTaskInput): Promise<ClientTask> => {
    const now = new Date().toISOString();
    let updated: ClientTask | undefined;
    CLIENT_TASKS = CLIENT_TASKS.map((t) => {
      if (t.id !== id) return t;
      updated = {
        ...t,
        name: input.name,
        description: input.description,
        type: input.type,
        checklistItems: input.checklistItems,
        color: input.color,
        order: input.order,
        required: input.required,
        status: input.status ?? t.status,
        dueDate: input.dueDate || undefined,
        assignScope: input.assignScope,
        clientIds: input.clientIds,
        updatedAt: now,
      };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 500);
  },

  setStatus: (id: number, status: TaskStatus): Promise<ClientTask> => {
    const now = new Date().toISOString();
    let updated: ClientTask | undefined;
    CLIENT_TASKS = CLIENT_TASKS.map((t) =>
      t.id === id ? (updated = { ...t, status, updatedAt: now }) : t,
    );
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 300);
  },

  remove: (id: number): Promise<{ id: number }> => {
    CLIENT_TASKS = CLIENT_TASKS.filter((t) => t.id !== id);
    return delay({ id }, 400);
  },

  /**
   * Assign a set of clients to a task. Forces the task into the "some" scope and
   * merges the ids into the existing target set (deduplicated).
   */
  assignClients: (taskId: number, clientIds: string[]): Promise<ClientTask> => {
    const now = new Date().toISOString();
    let updated: ClientTask | undefined;
    CLIENT_TASKS = CLIENT_TASKS.map((t) => {
      if (t.id !== taskId) return t;
      const merged = [...new Set([...t.clientIds, ...clientIds])];
      updated = { ...t, assignScope: "some", clientIds: merged, updatedAt: now };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 400);
  },

  /** Remove a single client from a task's target set. */
  unassignClient: (taskId: number, clientId: string): Promise<ClientTask> => {
    const now = new Date().toISOString();
    let updated: ClientTask | undefined;
    CLIENT_TASKS = CLIENT_TASKS.map((t) =>
      t.id !== taskId
        ? t
        : (updated = { ...t, clientIds: t.clientIds.filter((id) => id !== clientId), updatedAt: now }),
    );
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 300);
  },
};
