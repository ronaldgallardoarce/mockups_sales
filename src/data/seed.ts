import type { Block, Client, ClientTask, ClientTaskType, CompletedClientTask, DayCode, FrequencyType, GeneralTask, GeneralTaskResponseType, MacroRouteRef, Market, Polygon, Route, RouteFrequency, RouteMacro, Seller, SellerRouteAssignment, TaskPriority, WeekPosition } from "@/types";
import { CITIES, DEPARTMENT_NAME } from "./locations";
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
      // Just the editable label — city, channel and id are separate code segments.
      name: `${pick(ROUTE_PREFIX)} ${zone.toUpperCase()}`,
      color: channel.color,
      status: rand() < 0.72 ? "active" : "inactive",
      cityName: location.name,
      provinceName: location.provinceName,
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
    const location = pick(CITIES);
    return {
      id: `mkt_${String(i + 1).padStart(3, "0")}`,
      name,
      color: MARKET_COLORS[i % MARKET_COLORS.length],
      status: rand() < 0.8 ? "active" : "inactive",
      departmentName: DEPARTMENT_NAME,
      cityName: location.name,
      provinceName: location.provinceName,
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
function buildRandomFrequency(): RouteFrequency {
  // Weekly by default; other cadences are set per assignment in the UI.
  const type: FrequencyType = "SEMANAL";
  const weeks: WeekPosition[] = []; // only MENSUAL uses weeks

  // Random days: biased toward weekdays
  const allDays: DayCode[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const weekdayOnly = rand() < 0.75;
  const pool = weekdayOnly ? allDays.slice(0, 5) : allDays;
  const dayCount = 1 + Math.floor(rand() * Math.min(pool.length, 5));
  const days = [...pool].sort(() => rand() - 0.5).slice(0, dayCount).sort();

  // Validity: from 2026-07-14 for one year (matches the seed epoch).
  return { type, days, weeks, validFrom: "2026-07-14", validTo: "2027-07-14" };
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
      // Keep each seller's routes on disjoint manzanos so the seed never ships a
      // conflict (shared manzano -> shared clients -> double assignment).
      const usedBlocks = new Set<string>();
      let attempts = 0;
      while (routeAssignments.length < routeCount && attempts < 20) {
        attempts++;
        const r = pick(SEED_ROUTES);
        if (routeAssignments.some((a) => a.routeId === r.id)) continue;
        if (r.blockIds.some((b) => usedBlocks.has(b))) continue;
        routeAssignments.push({ routeId: r.id, frequency: buildRandomFrequency() });
        for (const b of r.blockIds) usedBlocks.add(b);
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

// ---- Tareas por cliente ----------------------------------------------------
const CLIENT_TASK_NAMES: { name: string; description: string; type: ClientTaskType }[] = [
  { name: "Foto de fachada", description: "Toma una foto del frente del local para validar la visita.", type: "foto" },
  { name: "Foto de exhibición", description: "Registra cómo quedó la exhibición de productos.", type: "foto" },
  { name: "Observaciones del punto", description: "Anota cualquier comentario relevante del cliente.", type: "texto" },
  { name: "Checklist de limpieza", description: "Verifica el estado del punto de venta.", type: "checklist" },
  { name: "Checklist de material POP", description: "Confirma la presencia del material publicitario.", type: "checklist" },
  { name: "Calificación de atención", description: "Califica la atención recibida en el punto.", type: "calificacion" },
  { name: "Foto de heladera", description: "Foto del estado de la heladera de la marca.", type: "foto" },
  { name: "Checklist de vencimientos", description: "Revisa productos próximos a vencer.", type: "checklist" },
];
const CLIENT_TASK_COLORS = ["#264bc5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];
const CHECKLIST_SAMPLES = [
  "Piso limpio", "Góndola ordenada", "Precios visibles", "Sin productos vencidos",
  "Material POP colocado", "Heladera funcionando", "Stock de seguridad", "Cartelería vigente",
];

function buildChecklistItems(): string[] {
  const count = 2 + Math.floor(rand() * 3); // 2..4 items
  return [...CHECKLIST_SAMPLES].sort(() => rand() - 0.5).slice(0, count);
}

function buildClientTasks(): ClientTask[] {
  const tasks: ClientTask[] = [];
  for (let i = 0; i < 22; i++) {
    const base = CLIENT_TASK_NAMES[i % CLIENT_TASK_NAMES.length];
    const scopeAll = rand() < 0.5;
    const clientIds: string[] = [];
    if (!scopeAll) {
      const count = 1 + Math.floor(rand() * 5); // 1..5 clients
      for (let k = 0; k < count; k++) {
        const c = pick(SEED_CLIENTS);
        if (!clientIds.includes(c.id)) clientIds.push(c.id);
      }
    }
    const created = new Date(2026, Math.floor(rand() * 6), Math.floor(between(1, 27)));
    // Roughly half the tasks carry a deadline a few days/weeks after creation.
    const dueDate =
      rand() < 0.55
        ? new Date(created.getTime() + Math.floor(between(3, 45)) * 86_400_000)
            .toISOString()
            .slice(0, 10)
        : undefined;
    tasks.push({
      id: i + 1,
      name: base.name,
      description: base.description,
      type: base.type,
      checklistItems: base.type === "checklist" ? buildChecklistItems() : [],
      color: CLIENT_TASK_COLORS[i % CLIENT_TASK_COLORS.length],
      order: i + 1,
      required: rand() < 0.6,
      status: rand() < 0.8 ? "active" : "inactive",
      dueDate,
      assignScope: scopeAll ? "all" : "some",
      clientIds,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return tasks;
}

export const SEED_CLIENT_TASKS: ClientTask[] = buildClientTasks();

// ---- Completed client tasks (visit responses) ------------------------------
const COMPLETION_NOTES = [
  "Tarea completada",
  "Realizado sin novedad",
  "Vitrina en orden y surtida",
  "Cliente atendido correctamente",
  "Se dejó material POP",
  "Exhibición actualizada",
];

function buildClientTaskCompletions(): CompletedClientTask[] {
  const completions: CompletedClientTask[] = [];
  const activeSellers = SEED_SELLERS.filter((s) => s.status === "ACTIVO");
  const sellerPool = activeSellers.length ? activeSellers : SEED_SELLERS;
  let visitId = 1;

  for (const task of SEED_CLIENT_TASKS) {
    // Only some tasks have been completed so far.
    if (rand() < 0.25) continue;
    const n = 1 + Math.floor(rand() * 4); // 1..4 completions by different employees
    // Prefer the task's targeted clients, else any client.
    const clientPool =
      task.assignScope === "some" && task.clientIds.length
        ? SEED_CLIENTS.filter((c) => task.clientIds.includes(c.id))
        : SEED_CLIENTS;
    const pool = clientPool.length ? clientPool : SEED_CLIENTS;

    for (let k = 0; k < n; k++) {
      const seller = pick(sellerPool);
      const client = pick(pool);
      completions.push({
        customerId: numId(client.id),
        customerName: client.name,
        ownerId: numId(client.id),
        ownerName: client.ownerName,
        employeeId: seller.code,
        employeeName: seller.name,
        visitId: visitId++,
        visitTaskId: task.id,
        response:
          task.type === "texto" || task.type === "foto" ? pick(COMPLETION_NOTES) : null,
        checkListResponse:
          task.type === "checklist"
            ? task.checklistItems.map((item) => ({ item, checked: rand() < 0.75 }))
            : null,
        ratingResponse: task.type === "calificacion" ? 1 + Math.floor(rand() * 5) : null,
        visitTaskPhotos:
          task.type === "foto"
            ? Array.from({ length: 1 + Math.floor(rand() * 3) }, (_, i) => ({
                id: i + 1,
                url: "url",
              }))
            : [],
      });
    }
  }
  return completions;
}

export const SEED_CLIENT_TASK_COMPLETIONS: CompletedClientTask[] = buildClientTaskCompletions();

// ---- Tareas generales ------------------------------------------------------
const GENERAL_TASK_ITEMS: { title: string; description: string; responseType: GeneralTaskResponseType }[] = [
  { title: "Relevamiento de precios", description: "Tomar precios de la competencia en la zona asignada.", responseType: "toma_precio" },
  { title: "Censo de clientes nuevos", description: "Registrar comercios nuevos no cargados en el sistema.", responseType: "texto" },
  { title: "Foto de puntos de venta", description: "Enviar fotos de los principales puntos de venta.", responseType: "foto" },
  { title: "Checklist de apertura", description: "Completar el checklist de apertura de ruta.", responseType: "checklist" },
  { title: "Calificación de rutas", description: "Calificar el estado general de la ruta.", responseType: "calificacion" },
  { title: "Reporte de faltantes", description: "Reportar productos faltantes en la zona.", responseType: "inventario_faltante" },
  { title: "Verificación de material POP", description: "Confirmar la colocación de material publicitario.", responseType: "checklist" },
  { title: "Encuesta de satisfacción", description: "Aplicar encuesta breve a clientes clave.", responseType: "texto" },
  { title: "Toma de precios lácteos", description: "Relevar precios de la categoría lácteos.", responseType: "toma_precio" },
  { title: "Foto de quiebres de stock", description: "Fotografiar góndolas con quiebre de stock.", responseType: "foto" },
];
const GENERAL_TASK_COLORS = ["#264bc5", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6"];
const GENERAL_TASK_PRIORITIES: TaskPriority[] = ["baja", "normal", "alta", "urgente"];

function buildGeneralTasks(): GeneralTask[] {
  const tasks: GeneralTask[] = [];
  for (let i = 0; i < 20; i++) {
    const base = GENERAL_TASK_ITEMS[i % GENERAL_TASK_ITEMS.length];
    const scopeAll = rand() < 0.45;
    const sellerCodes: number[] = [];
    if (!scopeAll) {
      const count = 1 + Math.floor(rand() * 4); // 1..4 sellers
      for (let k = 0; k < count; k++) {
        const s = pick(SEED_SELLERS);
        if (!sellerCodes.includes(s.code)) sellerCodes.push(s.code);
      }
    }
    const created = new Date(2026, Math.floor(rand() * 6), Math.floor(between(1, 27)));
    // ~60% carry an optional due date a few weeks out.
    const hasDue = rand() < 0.6;
    const due = new Date(created);
    due.setDate(due.getDate() + 7 + Math.floor(rand() * 30));
    tasks.push({
      id: i + 1,
      title: base.title,
      description: base.description,
      responseType: base.responseType,
      checklistItems: base.responseType === "checklist" ? buildChecklistItems() : [],
      priority: GENERAL_TASK_PRIORITIES[Math.floor(rand() * GENERAL_TASK_PRIORITIES.length)],
      color: GENERAL_TASK_COLORS[i % GENERAL_TASK_COLORS.length],
      dueDate: hasDue ? due.toISOString().slice(0, 10) : undefined,
      status: rand() < 0.8 ? "active" : "inactive",
      assignScope: scopeAll ? "all" : "some",
      sellerCodes,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return tasks;
}

export const SEED_GENERAL_TASKS: GeneralTask[] = buildGeneralTasks();
