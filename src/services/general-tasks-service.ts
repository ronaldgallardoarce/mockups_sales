import type { GeneralTask, GeneralTaskInput, TaskPriority, TaskStatus } from "@/types";
import { SEED_GENERAL_TASKS } from "@/data/seed";
import { delay } from "@/lib/utils";
import type { Paginated } from "./routes-service";

export interface ListGeneralTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  search?: string;
}

/**
 * In-memory mutable repository standing in for the general-tasks REST resource.
 * Kept module level so mutations survive navigation within the session.
 */
let GENERAL_TASKS: GeneralTask[] = [...SEED_GENERAL_TASKS];

export const generalTasksService = {
  list: (): Promise<GeneralTask[]> => delay([...GENERAL_TASKS], 500),

  /** Server-style paginated + filtered list (as the real API returns it). */
  listPaged: ({
    page = 1,
    limit = 8,
    status = "all",
    priority = "all",
    search = "",
  }: ListGeneralTasksParams = {}): Promise<Paginated<GeneralTask>> => {
    const q = search.trim().toLowerCase();
    const filtered = GENERAL_TASKS.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (priority === "all" || t.priority === priority) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)),
    );
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * limit, safePage * limit);
    return delay({ data, pagination: { page: safePage, limit, totalItems, totalPages } }, 450);
  },

  get: (id: number): Promise<GeneralTask | undefined> =>
    delay(GENERAL_TASKS.find((t) => t.id === id), 300),

  create: (input: GeneralTaskInput): Promise<GeneralTask> => {
    const now = new Date().toISOString();
    const nextId = GENERAL_TASKS.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const task: GeneralTask = {
      id: nextId,
      ...input,
      status: input.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };
    GENERAL_TASKS = [task, ...GENERAL_TASKS];
    return delay(task, 500);
  },

  update: (id: number, input: GeneralTaskInput): Promise<GeneralTask> => {
    const now = new Date().toISOString();
    let updated: GeneralTask | undefined;
    GENERAL_TASKS = GENERAL_TASKS.map((t) => {
      if (t.id !== id) return t;
      updated = {
        ...t,
        ...input,
        status: input.status ?? t.status,
        updatedAt: now,
      };
      return updated;
    });
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 500);
  },

  setStatus: (id: number, status: TaskStatus): Promise<GeneralTask> => {
    const now = new Date().toISOString();
    let updated: GeneralTask | undefined;
    GENERAL_TASKS = GENERAL_TASKS.map((t) =>
      t.id === id ? (updated = { ...t, status, updatedAt: now }) : t,
    );
    if (!updated) return Promise.reject(new Error("Tarea no encontrada"));
    return delay(updated, 300);
  },

  remove: (id: number): Promise<{ id: number }> => {
    GENERAL_TASKS = GENERAL_TASKS.filter((t) => t.id !== id);
    return delay({ id }, 400);
  },
};
