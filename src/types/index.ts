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

export type EmployeeStatus = "active" | "inactive";

/**
 * Empleado — a salesperson. Their channels/subcanales are NOT stored directly:
 * they're derived from the routes assigned to them (routeIds).
 */
export interface Employee {
  id: string;
  code: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  routeIds: string[];
  createdAt: string;
  updatedAt: string;
}
