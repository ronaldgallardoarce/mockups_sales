/**
 * Domain types for the Sales Route Management microservice.
 *
 * Relationships:
 *   Channel (Canal de Venta) 1─┬─* Subcanal 1─┬─* Client
 *                              └─* Block (manzano, polygon on the map)
 *   Route *──* Channel / Subcanal (a route serves selected channels & subcanales)
 */

export type LatLng = [number, number];

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
  channelIds: string[];
  subcanalIds: string[];
  /** Manzanos (block ids) that compose the route's geographic coverage. */
  blockIds: string[];
  startDate: string;
  clientCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload used by create / update forms. */
export interface RouteInput {
  name: string;
  color: string;
  status: RouteStatus;
  channelIds: string[];
  subcanalIds: string[];
  blockIds: string[];
  startDate: string;
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

/** How often a seller visits a specific route. */
export interface RouteFrequency {
  /** Which weeks of the month the visit happens (1-4). */
  weeks: WeekPosition[];
  /** Which days of the week the visit happens. */
  days: DayCode[];
}

/** One route assignment with its visit frequency. */
export interface SellerRouteAssignment {
  routeId: string;
  frequency: RouteFrequency;
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
