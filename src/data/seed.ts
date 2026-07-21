import type { Block, Client, DayCode, MacroRouteRef, Market, Polygon, Route, RouteMacro, Seller, SellerRouteAssignment, WeekPosition } from "@/types";
import { PROVINCES } from "./locations";
import { numId, seededRandom } from "@/lib/utils";
import { pointInPolygon } from "@/lib/geo";
import { CHANNELS, SUBCANALES, getSubcanalesByChannel } from "./channels";
import { SANTA_CRUZ_BLOCKS } from "./blocks-data";

const rand = seededRandom(20260714);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);

const STORE_PREFIX = [
  "Tienda", "Comercial", "Distribuidora", "Minimarket", "Abarrotes",
  "Bodega", "Mercadito", "Super", "Kiosco", "Almacén",
];
const STORE_NAME = [
  "El Progreso", "Doña Rosa", "San Juan", "La Esquina", "El Trébol",
  "Los Andes", "Santa Cruz", "El Buen Precio", "La Familia", "El Sol",
  "Beni", "Mamoré", "El Carmen", "Loma Suárez", "Pompeya",
  "El Chorro", "Las Palmas", "Trinidad", "La Cabaña", "El Puente",
];
const OWNER_FIRST = ["Juan", "María", "Carlos", "Ana", "Luis", "Rosa", "Pedro", "Lucía", "Jorge", "Elena", "Raúl", "Carmen"];
const OWNER_LAST = ["Suárez", "Justiniano", "Rivero", "Vaca", "Áñez", "Moreno", "Roca", "Guzmán", "Melgar", "Ribera"];
const STREETS = ["Av. 6 de Agosto", "Calle La Paz", "Av. Cipriano Barace", "Calle Nicolás Suárez", "Av. Bolívar", "Calle Sucre", "Av. Ganadera", "Calle Vaca Díez"];

function polygonCentroid(poly: Polygon): [number, number] {
  const n = poly.length;
  const s = poly.reduce<[number, number]>((a, [la, ln]) => [a[0] + la, a[1] + ln], [0, 0]);
  return [s[0] / n, s[1] / n];
}

/** Axis-aligned bounding box covering every given polygon. */
function bboxOf(polys: Polygon[]) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const poly of polys) {
    for (const [la, ln] of poly) {
      minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
      minLng = Math.min(minLng, ln); maxLng = Math.max(maxLng, ln);
    }
  }
  return { minLat, maxLat, minLng, maxLng };
}

/** A random point that actually falls inside the polygon (rejection sampling). */
function randomPointInPolygon(poly: Polygon): [number, number] {
  const { minLat, maxLat, minLng, maxLng } = bboxOf([poly]);
  for (let i = 0; i < 40; i++) {
    const la = between(minLat, maxLat);
    const ln = between(minLng, maxLng);
    if (pointInPolygon([la, ln], poly)) return [la, ln];
  }
  return polygonCentroid(poly);
}

// Weighted channel distribution for clients (TRADICIONAL dominates).
const CHANNEL_WEIGHTS: string[] = [
  ...Array(6).fill("ch_tradicional"),
  ...Array(3).fill("ch_moderno"),
  ...Array(3).fill("ch_limpieza"),
  ...Array(2).fill("ch_ferias"),
  ...Array(2).fill("ch_panaderia"),
];

// ---- Blocks (manzanos): real polygons drawn over Santa Cruz de la Sierra --
export const SEED_BLOCKS: Block[] = SANTA_CRUZ_BLOCKS;

// ---- Clients: some inside the manzanos, some scattered outside them --------
function buildClients(): Client[] {
  const clients: Client[] = [];
  const push = (lat: number, lng: number) => {
    // Channel / subcanal are properties of the client, not of the block.
    const channelId = pick(CHANNEL_WEIGHTS);
    const subs = getSubcanalesByChannel(channelId);
    const subcanalId = subs.length ? pick(subs).id : SUBCANALES[0].id;
    const idx = clients.length + 1;
    clients.push({
      id: `cli_${String(idx).padStart(3, "0")}`,
      code: `C-${String(1000 + idx)}`,
      name: `${pick(STORE_PREFIX)} ${pick(STORE_NAME)}`,
      ownerName: `${pick(OWNER_FIRST)} ${pick(OWNER_LAST)}`,
      address: `${pick(STREETS)} #${Math.floor(between(100, 999))}`,
      phone: `+591 ${Math.floor(between(6000000, 7999999))}`,
      subcanalId,
      channelId,
      lat,
      lng,
      ticketPromedio: Math.round(between(800, 6000)),
      dropSize: Math.round(between(60, 700)),
    });
  };

  // Inside: most manzanos host 1-2 clients placed within their polygon.
  for (const block of SEED_BLOCKS) {
    const n = rand() < 0.78 ? (rand() < 0.4 ? 2 : 1) : 0;
    for (let k = 0; k < n; k++) {
      const [la, ln] = randomPointInPolygon(block.polygon);
      push(la, ln);
    }
  }

  // Outside: scattered points across the overall area that fall in NO manzano,
  // so the map also shows clients that no route currently covers.
  const bounds = bboxOf(SEED_BLOCKS.map((b) => b.polygon));
  const padLat = (bounds.maxLat - bounds.minLat) * 0.06;
  const padLng = (bounds.maxLng - bounds.minLng) * 0.06;
  let added = 0;
  let guard = 0;
  while (added < 18 && guard < 3000) {
    guard += 1;
    const la = between(bounds.minLat - padLat, bounds.maxLat + padLat);
    const ln = between(bounds.minLng - padLng, bounds.maxLng + padLng);
    if (SEED_BLOCKS.some((b) => pointInPolygon([la, ln], b.polygon))) continue;
    push(la, ln);
    added += 1;
  }

  return clients;
}

export const SEED_CLIENTS: Client[] = buildClients();

// ---- Routes ----------------------------------------------------------------
const ZONES = [
  "Centro", "Norte", "Sur", "Este", "Oeste", "Pompeya", "El Carmen",
  "Loma Suárez", "San Vicente", "Villa Corina", "12 de Octubre", "Los Tajibos",
  "Cabildo", "La Sirena", "Mangalito", "El Mirador",
];

function countClientsInBlocks(blockIds: string[], subcanalIds: string[]): number {
  const polys = SEED_BLOCKS.filter((b) => blockIds.includes(b.id));
  return SEED_CLIENTS.filter(
    (c) =>
      subcanalIds.includes(c.subcanalId) &&
      polys.some((b) => pointInPolygon([c.lat, c.lng], b.polygon)),
  ).length;
}

const ROUTE_PREFIX = ["ZONA", "RUTA", "SECTOR"];

// City / province pairs (Santa Cruz department) to populate route location.
const CITIES: { city: string; province: string }[] = [
  { city: "SANTA CRUZ", province: "ANDRES IBAÑEZ" },
  { city: "MONTERO", province: "OBISPO SANTISTEVAN" },
  { city: "WARNES", province: "WARNES" },
  { city: "LA GUARDIA", province: "ANDRES IBAÑEZ" },
  { city: "COTOCA", province: "ANDRES IBAÑEZ" },
  { city: "PORTACHUELO", province: "SARA" },
];

function buildRoutes(): Route[] {
  const routes: Route[] = [];
  // Enough routes so the paginated list spans several pages.
  for (let i = 0; i < 60; i++) {
    const channel = pick(CHANNELS);
    // 30% chance of a second channel for variety.
    const channelIds = [channel.id];
    if (rand() < 0.3) {
      const extra = pick(CHANNELS);
      if (!channelIds.includes(extra.id)) channelIds.push(extra.id);
    }
    const subcanalIds = channelIds.flatMap((cid) => {
      const subs = getSubcanalesByChannel(cid);
      // keep 1..all subcanales
      const count = Math.max(1, Math.floor(rand() * subs.length) + 1);
      return subs.slice(0, count).map((s) => s.id);
    });
    // A route is composed of several manzanos.
    const blockIds: string[] = [];
    const blockCount = 3 + Math.floor(rand() * 6); // 3..8
    for (let k = 0; k < blockCount; k++) {
      const b = pick(SEED_BLOCKS);
      if (!blockIds.includes(b.id)) blockIds.push(b.id);
    }
    const zone = ZONES[i % ZONES.length];
    const location = pick(CITIES);
    const created = new Date(2025, Math.floor(rand() * 11), Math.floor(between(1, 27)));
    const startDate = new Date(2025, Math.floor(rand() * 11), Math.floor(between(1, 27)));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    routes.push({
      id: `rt_${String(i + 1).padStart(3, "0")}`,
      name: `${pick(ROUTE_PREFIX)} ${i + 1} ${zone.toUpperCase()} · ${channel.name}`,
      color: channel.color,
      status: rand() < 0.72 ? "active" : "inactive",
      cityName: location.city,
      provinceName: location.province,
      channelIds,
      subcanalIds,
      blockIds,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      clientCount: countClientsInBlocks(blockIds, subcanalIds),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return routes;
}

export const SEED_ROUTES: Route[] = buildRoutes();

// ---- Mercados: geographic areas made of manzanos (no channels) -------------
const MARKET_NAMES = [
  "Mercado Central", "Mercado Los Pozos", "Mercado La Ramada", "Mercado Abasto",
  "Mercado Mutualista", "Mercado Siete Calles", "Mercado Florida", "Mercado Nuevo",
];
const MARKET_COLORS = ["#264bc5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];

function buildMarkets(): Market[] {
  return MARKET_NAMES.map((name, i) => {
    const blockIds: string[] = [];
    const count = 2 + Math.floor(rand() * 5); // 2..6 manzanos
    for (let k = 0; k < count; k++) {
      const b = pick(SEED_BLOCKS);
      if (!blockIds.includes(b.id)) blockIds.push(b.id);
    }
    const created = new Date(2025, Math.floor(rand() * 11), Math.floor(between(1, 27)));
    return {
      id: `mkt_${String(i + 1).padStart(3, "0")}`,
      name,
      color: MARKET_COLORS[i % MARKET_COLORS.length],
      provinceName: pick(PROVINCES).name,
      blockIds,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    };
  });
}

export const SEED_MARKETS: Market[] = buildMarkets();

// ---- Macrorutas ------------------------------------------------------------
const MACRO_ZONES = [
  "Trinidad", "Beni Norte", "Beni Sur", "Centro Histórico", "Periférico",
  "Cercado", "Mamoré", "Ganadera", "Comercial", "Zona Franca",
  "Corredor Este", "Corredor Oeste",
];

/** Map a seed Route into the summary shape embedded in a macro's payload. */
export function toMacroRouteRef(route: Route): MacroRouteRef {
  return {
    id: numId(route.id),
    name: route.name,
    color: route.color,
    activeFlag: route.status === "active",
    distributorId: 9,
    valid_from: route.startDate,
    valid_to: route.endDate,
  };
}

function buildRouteMacros(): RouteMacro[] {
  const macros: RouteMacro[] = [];
  for (let i = 0; i < 28; i++) {
    // Each macro groups 2..6 distinct routes, embedded as summaries.
    const picked: Route[] = [];
    const count = 2 + Math.floor(rand() * 5);
    for (let k = 0; k < count; k++) {
      const r = pick(SEED_ROUTES);
      if (!picked.some((p) => p.id === r.id)) picked.push(r);
    }
    const zone = MACRO_ZONES[i % MACRO_ZONES.length];
    macros.push({
      id: i + 1,
      name: `MACRO ${zone.toUpperCase()}`,
      routes: picked.map(toMacroRouteRef),
    });
  }
  return macros;
}

export const SEED_ROUTE_MACROS: RouteMacro[] = buildRouteMacros();

// ---- Sellers (Vendedores) --------------------------------------------------
function buildRandomFrequency(): { weeks: WeekPosition[]; days: DayCode[] } {
  // Random weeks: 1-4 (biased toward all weeks)
  const weekCount = rand() < 0.6 ? 4 : 1 + Math.floor(rand() * 4);
  const allWeeks: WeekPosition[] = [1, 2, 3, 4];
  const weeks = weekCount >= 4
    ? allWeeks
    : [...allWeeks].sort(() => rand() - 0.5).slice(0, weekCount).sort();

  // Random days: biased toward weekdays
  const allDays: DayCode[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const weekdayOnly = rand() < 0.75;
  const pool = weekdayOnly ? allDays.slice(0, 5) : allDays;
  const dayCount = 1 + Math.floor(rand() * Math.min(pool.length, 5));
  const days = [...pool].sort(() => rand() - 0.5).slice(0, dayCount).sort();

  return { weeks, days };
}

function buildSellers(): Seller[] {
  const sellers: Seller[] = [];
  for (let i = 0; i < 24; i++) {
    const first = pick(OWNER_FIRST);
    const last = pick(OWNER_LAST);
    const idx = i + 1;
    // Most sellers carry 1-3 routes; a few start with none (empty state).
    const routeAssignments: SellerRouteAssignment[] = [];
    if (rand() > 0.15) {
      const routeCount = 1 + Math.floor(rand() * 3); // 1..3
      for (let k = 0; k < routeCount; k++) {
        const r = pick(SEED_ROUTES);
        if (!routeAssignments.some((a) => a.routeId === r.id)) {
          routeAssignments.push({ routeId: r.id, frequency: buildRandomFrequency() });
        }
      }
    }
    sellers.push({
      code: 5000 + idx,
      name: `${first} ${last}`.toUpperCase(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@grupovenado.com`,
      // The real API returns null for some sellers.
      phone: rand() < 0.85 ? `+591 ${Math.floor(between(6000000, 7999999))}` : null,
      status: rand() < 0.85 ? "ACTIVO" : "INACTIVO",
      routeAssignments,
    });
  }
  return sellers;
}

export const SEED_SELLERS: Seller[] = buildSellers();
