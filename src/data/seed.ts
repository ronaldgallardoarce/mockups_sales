import type { Block, Client, Polygon, Route } from "@/types";
import { seededRandom } from "@/lib/utils";
import { TRINIDAD_CENTER, pointInPolygon } from "@/lib/geo";
import { CHANNELS, SUBCANALES, getSubcanalesByChannel } from "./channels";

const rand = seededRandom(20260714);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);

const [CLAT, CLNG] = TRINIDAD_CENTER;

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

/** Build an irregular block-shaped polygon (5–7 vertices) centered at (lat,lng). */
function makeBlock(lat: number, lng: number, size: number): Polygon {
  const n = 5 + Math.floor(rand() * 3); // 5..7 vertices
  const base = size / 2;
  const poly: Polygon = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.55;
    const r = base * (0.6 + rand() * 0.5);
    poly.push([lat + Math.sin(angle) * r, lng + Math.cos(angle) * r]);
  }
  return poly;
}

function polygonCentroid(poly: Polygon): [number, number] {
  const n = poly.length;
  const s = poly.reduce<[number, number]>((a, [la, ln]) => [a[0] + la, a[1] + ln], [0, 0]);
  return [s[0] / n, s[1] / n];
}

// ---- Blocks (manzanos): grid around the city center ----------------------
const COLS = 8;
const ROWS = 6;
const CELL = 0.0055; // ~600 m

// Weighted channel distribution for clients (TRADICIONAL dominates).
const CHANNEL_WEIGHTS: string[] = [
  ...Array(6).fill("ch_tradicional"),
  ...Array(3).fill("ch_moderno"),
  ...Array(3).fill("ch_limpieza"),
  ...Array(2).fill("ch_ferias"),
  ...Array(2).fill("ch_panaderia"),
];

/** Blocks are pure geographic sectors: only a polygon + auto label. */
function buildBlocks(): Block[] {
  const blocks: Block[] = [];
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Skip a few cells so the grid isn't perfectly full (~40 blocks).
      if (rand() < 0.16) continue;
      const lat = CLAT + (r - ROWS / 2) * CELL;
      const lng = CLNG + (c - COLS / 2) * CELL;
      n += 1;
      blocks.push({
        id: `blk_${String(n).padStart(3, "0")}`,
        polygon: makeBlock(lat, lng, CELL * 0.82),
        createdAt: new Date(2025, 0, 1 + n).toISOString(),
      });
    }
  }
  return blocks;
}

export const SEED_BLOCKS: Block[] = buildBlocks();

// ---- Clients: positioned near blocks, channel assigned independently ------
function buildClients(): Client[] {
  const clients: Client[] = [];
  const target = 46;
  let i = 0;
  while (clients.length < target) {
    const block = SEED_BLOCKS[i % SEED_BLOCKS.length];
    i += 1;
    // ~60% of blocks host a client on each pass.
    if (rand() < 0.4) continue;
    const [blat, blng] = polygonCentroid(block.polygon);
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
      lat: blat + (rand() - 0.5) * CELL * 0.55,
      lng: blng + (rand() - 0.5) * CELL * 0.55,
    });
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
    const created = new Date(2025, Math.floor(rand() * 11), Math.floor(between(1, 27)));
    routes.push({
      id: `rt_${String(i + 1).padStart(3, "0")}`,
      name: `${pick(ROUTE_PREFIX)} ${i + 1} ${zone.toUpperCase()} · ${channel.name}`,
      color: channel.color,
      status: rand() < 0.72 ? "active" : "inactive",
      channelIds,
      subcanalIds,
      blockIds,
      startDate: new Date(2025, Math.floor(rand() * 11), Math.floor(between(1, 27))).toISOString(),
      clientCount: countClientsInBlocks(blockIds, subcanalIds),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return routes;
}

export const SEED_ROUTES: Route[] = buildRoutes();
