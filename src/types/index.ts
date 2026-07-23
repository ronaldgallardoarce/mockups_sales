/**
 * Domain types for the Sales Route Management microservice.
 *
 * Relationships:
 *   Channel (Canal de Venta) 1─┬─* Subcanal 1─┬─* Client
 *                              └─* Block (manzano, polygon on the map)
 *   Route *──* Channel / Subcanal (a route serves selected channels & subcanales)
 */

export type LatLng = [number, number];

/** System roles. The signed-in user's role gates features across the app. */
export type Role = "administrador" | "supervisor" | "vendedor";

/** A signed-in user (mocked). Supervisors carry the sales channel they oversee. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Sales channel the user oversees (e.g. a supervisor of "tradicional"). */
  channelName?: string;
}

/** A polygon ring: list of [lat, lng] points. */
export type Polygon = LatLng[];

export type RouteStatus = "active" | "inactive";

/** Canal de Venta — top level commercial channel. */
export interface Channel {
  id: string;
  name: string;
  /** Hex color used consistently across list / form / map. */
  color: string;
  description?: string;
}

/** Subcanal — belongs to exactly one Channel. */
export interface Subcanal {
  id: string;
  channelId: string;
  name: string;
}

/** Cliente — a point of sale located inside the city grid. */
export interface Client {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  subcanalId: string;
  channelId: string;
  lat: number;
  lng: number;
  /** Average monthly purchase of the client (Bs). */
  ticketPromedio: number;
  /** Single-visit sale generated when the seller visits (Bs). */
  dropSize: number;
}

/**
 * Polígono ("manzano") — a purely geographic area with NO name, channel or
 * color: just an id and its vertices. Its only purpose is to locate/group the
 * clients that fall inside it by position.
 */
export interface Block {
  id: string;
  polygon: Polygon;
  createdAt: string;
}

/** Ruta — a sales route made up of several manzanos (blocks). */
export interface Route {
  id: string;
  name: string;
  color: string;
  status: RouteStatus;
  /** City / province the route belongs to (backend: cityName / provinceName). */
  cityName?: string;
  provinceName?: string;
  channelIds: string[];
  subcanalIds: string[];
  /** Manzanos (block ids) that compose the route's geographic coverage. */
  blockIds: string[];
  /** Markets assigned to the route (traditional channel only). */
  marketIds?: string[];
  /** Validity window (valid_from / valid_to in the backend). */
  startDate: string;
  endDate: string;
  clientCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload used by create / update forms. */
export interface RouteInput {
  name: string;
  color: string;
  status: RouteStatus;
  /** City the route belongs to (backend: cityName). */
  cityName?: string;
  /** Province, derived from the selected city. */
  provinceName?: string;
  channelIds: string[];
  subcanalIds: string[];
  blockIds: string[];
  marketIds?: string[];
}

/**
 * A route as embedded in a macro's list payload — a summary (no blocks). Field
 * names mirror the backend response verbatim (activeFlag / valid_from / valid_to).
 */
export interface MacroRouteRef {
  id: number;
  name: string;
  color: string;
  activeFlag: boolean;
  distributorId: number;
  valid_from: string;
  valid_to: string;
}

/**
 * Macroruta — a named grouping of several routes. The list endpoint returns the
 * macro's routes embedded as summaries (see MacroRouteRef); it has no geometry
 * of its own.
 */
export interface RouteMacro {
  id: number;
  name: string;
  routes: MacroRouteRef[];
}

/** Payload used by create / update macro forms (send the selected route ids). */
export interface RouteMacroInput {
  name: string;
  routeIds: number[];
}

/**
 * Mercado — a named geographic area made up of manzanos (blocks), similar to a
 * Route but without channels/subcanales. Only administrators can draw them.
 */
export interface Market {
  id: string;
  name: string;
  color: string;
  /** Active / inactive — markets are deactivated (not deleted) from the list. */
  status: RouteStatus;
  /** Department the market belongs to (backend: departmentName). */
  departmentName?: string;
  /** City the market belongs to (backend: cityName). */
  cityName?: string;
  provinceName?: string;
  /** Manzanos (block ids) that compose the market's area. */
  blockIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload used by create / update market forms. */
export interface MarketInput {
  name: string;
  color: string;
  /** Active / inactive. Defaults to active on create. */
  status?: RouteStatus;
  /** Department (derived; all mock cities are in Santa Cruz). */
  departmentName?: string;
  /** City the market belongs to (backend: cityName). */
  cityName?: string;
  /** Province, derived from the selected city. */
  provinceName?: string;
  blockIds: string[];
}

export type SellerStatus = "ACTIVO" | "INACTIVO";

/** Week positions within a month (1 = first week, 4 = last week). */
export type WeekPosition = 1 | 2 | 3 | 4;

/** Day-of-week codes used for route frequency. */
export type DayCode = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

/** Label maps for UI display. */
export const WEEK_LABELS: Record<WeekPosition, string> = {
  1: "1ra semana",
  2: "2da semana",
  3: "3ra semana",
  4: "4ta semana",
};

export const DAY_LABELS: Record<DayCode, string> = {
  MO: "Lunes",
  TU: "Martes",
  WE: "Miércoles",
  TH: "Jueves",
  FR: "Viernes",
  SA: "Sábado",
  SU: "Domingo",
};

export const ALL_WEEKS: WeekPosition[] = [1, 2, 3, 4];
export const ALL_DAYS: DayCode[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
export const WEEKDAY_DAYS: DayCode[] = ["MO", "TU", "WE", "TH", "FR"];

/** Cadence type of a route visit. */
export type FrequencyType = "SEMANAL" | "QUINCENAL" | "MENSUAL";

export const FREQUENCY_TYPE_LABELS: Record<FrequencyType, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

export const ALL_FREQUENCY_TYPES: FrequencyType[] = ["SEMANAL", "QUINCENAL", "MENSUAL"];

/**
 * How often a seller visits a specific route:
 *  - SEMANAL:   every week on `days`.
 *  - QUINCENAL: every other week on `days`; the cycle is anchored to `validFrom`.
 *  - MENSUAL:   on the selected `weeks` of the month, on `days`.
 *
 * `weeks` is only meaningful for MENSUAL. `validFrom`/`validTo` are date-only ISO
 * strings (`YYYY-MM-DD`); mapping them to full timestamps is an API concern.
 */
export interface RouteFrequency {
  /** Cadence type. */
  type: FrequencyType;
  /** Which days of the week the visit happens. */
  days: DayCode[];
  /** Which weeks of the month the visit happens (MENSUAL only). */
  weeks: WeekPosition[];
  /** Start of the validity window (YYYY-MM-DD). */
  validFrom: string;
  /** End of the validity window (YYYY-MM-DD). */
  validTo: string;
}

/** One route assignment with its visit frequency. */
export interface SellerRouteAssignment {
  routeId: string;
  frequency: RouteFrequency;
}

/**
 * Seller detail response ("ver vendedor"). Field names mirror the backend
 * payload verbatim (including active_flag / valid_from / longitud / ownerNamer
 * and the stringified `coordinates`) so the real API response drops in as-is.
 */
export interface SellerDetailCustomer {
  customerId: number;
  ownerId: number;
  ownerNamer: string;
  latitude: number;
  longitud: number;
  customerName: string;
  subchannelName: string;
  subchannelId: number;
  assigned: boolean;
}

export interface SellerDetailBlock {
  code: number;
  name: string;
  /** JSON string: `[{'latitude':-20,'longitude':-50}, …]`. */
  coordinates: string;
  customers: SellerDetailCustomer[];
}

export interface SellerDetailRoute {
  id: number;
  name: string;
  color: string;
  active_flag: boolean;
  distributorId: number;
  valid_from: string;
  valid_to: string;
  /** Markets the route covers (traditional channel), for display. */
  markets: { name: string; color: string }[];
  blocks: SellerDetailBlock[];
}

export interface SellerDetail {
  name: string;
  user: string;
  email: string;
  activeFlag: boolean;
  avatar: string;
  assignRoutes: SellerDetailRoute[];
}

/**
 * Vendedor (Seller) — a salesperson, as returned by the sellers API:
 *   { code, name, phone, email, status }
 * `code` is the unique identifier. `phone` may be null. Channels/subcanales are
 * NOT stored directly: they're derived from the routes assigned, which
 * is managed by this app and not part of the list API payload.
 */
export interface Seller {
  /** Unique identifier coming from the sellers API. */
  code: number;
  name: string;
  email: string;
  phone: string | null;
  status: SellerStatus;
  /** App-managed route assignments with frequency (not part of the sellers list API). */
  routeAssignments: SellerRouteAssignment[];
}

// ---- Tareas (Tasks) --------------------------------------------------------

/** Active / inactive — tasks are deactivated (not deleted) from the list. */
export type TaskStatus = "active" | "inactive";

/** Whom a task is assigned to. */
export type TaskAssignScope = "all" | "some";

/** Priority of a general task. */
export type TaskPriority = "baja" | "normal" | "alta" | "urgente";

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export const ALL_TASK_PRIORITIES: TaskPriority[] = ["baja", "normal", "alta", "urgente"];

/** Kind of answer a per-client task expects on the field. */
export type ClientTaskType = "foto" | "texto" | "checklist" | "calificacion";

export const CLIENT_TASK_TYPE_LABELS: Record<ClientTaskType, string> = {
  foto: "Foto",
  texto: "Texto",
  checklist: "Checklist",
  calificacion: "Calificación",
};

export const ALL_CLIENT_TASK_TYPES: ClientTaskType[] = [
  "foto",
  "texto",
  "checklist",
  "calificacion",
];

/** Kind of answer a general task expects. */
export type GeneralTaskResponseType =
  | "foto"
  | "texto"
  | "checklist"
  | "calificacion"
  | "toma_precio"
  | "inventario_faltante";

export const GENERAL_TASK_RESPONSE_TYPE_LABELS: Record<GeneralTaskResponseType, string> = {
  foto: "Foto",
  texto: "Texto",
  checklist: "Checklist",
  calificacion: "Calificación",
  toma_precio: "Toma de precio",
  inventario_faltante: "Inventario / faltante",
};

export const ALL_GENERAL_TASK_RESPONSE_TYPES: GeneralTaskResponseType[] = [
  "foto",
  "texto",
  "checklist",
  "calificacion",
  "toma_precio",
  "inventario_faltante",
];

/**
 * Tarea por cliente — a recurring task shown on a client's card during a visit.
 * `checklistItems` is only meaningful when `type === "checklist"`.
 */
export interface ClientTask {
  id: number;
  name: string;
  description: string;
  type: ClientTaskType;
  /** Checklist entries (only used when type === "checklist"). */
  checklistItems: string[];
  color: string;
  /** Position the task takes in the client's task list. */
  order: number;
  /** Whether answering the task is mandatory. */
  required: boolean;
  status: TaskStatus;
  /** Optional deadline (YYYY-MM-DD). */
  dueDate?: string;
  /** "all" = every client; "some" = only `clientIds`. */
  assignScope: TaskAssignScope;
  /** Target client ids when assignScope === "some". */
  clientIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload used by create / update per-client task forms. */
export interface ClientTaskInput {
  name: string;
  description: string;
  type: ClientTaskType;
  checklistItems: string[];
  color: string;
  order: number;
  required: boolean;
  status?: TaskStatus;
  dueDate?: string;
  assignScope: TaskAssignScope;
  clientIds: string[];
}

/**
 * Tarea general — a one-off task assigned to sellers, with a priority and an
 * optional due date. `checklistItems` is only used when responseType === "checklist".
 */
export interface GeneralTask {
  id: number;
  title: string;
  description: string;
  responseType: GeneralTaskResponseType;
  checklistItems: string[];
  priority: TaskPriority;
  color: string;
  /** Optional deadline (YYYY-MM-DD). */
  dueDate?: string;
  status: TaskStatus;
  /** "all" = every seller; "some" = only `sellerCodes`. */
  assignScope: TaskAssignScope;
  /** Target seller codes when assignScope === "some". */
  sellerCodes: number[];
  createdAt: string;
  updatedAt: string;
}

/** Payload used by create / update general task forms. */
export interface GeneralTaskInput {
  title: string;
  description: string;
  responseType: GeneralTaskResponseType;
  checklistItems: string[];
  priority: TaskPriority;
  color: string;
  dueDate?: string;
  status?: TaskStatus;
  assignScope: TaskAssignScope;
  sellerCodes: number[];
}
