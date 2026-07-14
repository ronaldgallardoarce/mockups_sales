import type { Channel, Subcanal } from "@/types";

/**
 * Sales channels (Canales de Venta) with a fixed color each. These colors are
 * the single source of truth for channel color-coding across list, form & map.
 */
export const CHANNELS: Channel[] = [
  {
    id: "ch_tradicional",
    name: "TRADICIONAL",
    color: "#6366f1",
    description: "Tiendas de barrio, kioscos y mercados tradicionales.",
  },
  {
    id: "ch_moderno",
    name: "MODERNO",
    color: "#06b6d4",
    description: "Autoservicios y cadenas de supermercados.",
  },
  {
    id: "ch_limpieza",
    name: "LIMPIEZA",
    color: "#10b981",
    description: "Distribución de línea de limpieza y hogar.",
  },
  {
    id: "ch_ferias",
    name: "FERIAS",
    color: "#f59e0b",
    description: "Ferias zonales y puntos temporales.",
  },
  {
    id: "ch_panaderia",
    name: "PANADERIA",
    color: "#ec4899",
    description: "Panaderías zonales y mayoristas de pan.",
  },
];

/** Subcanales — each belongs to exactly one channel. */
export const SUBCANALES: Subcanal[] = [
  // TRADICIONAL
  { id: "sc_mayorista", channelId: "ch_tradicional", name: "MAYORISTA" },
  { id: "sc_detallista", channelId: "ch_tradicional", name: "DETALLISTA" },
  { id: "sc_mayorista_pareto", channelId: "ch_tradicional", name: "MAYORISTA-PARETO" },
  // MODERNO
  { id: "sc_autoservicio", channelId: "ch_moderno", name: "AUTOSERVICIO" },
  { id: "sc_cadena", channelId: "ch_moderno", name: "CADENA" },
  // LIMPIEZA
  { id: "sc_mayorista_limpieza", channelId: "ch_limpieza", name: "MAYORISTA-LIMPIEZA" },
  { id: "sc_detallista_limpieza", channelId: "ch_limpieza", name: "DETALLISTA-LIMPIEZA" },
  // FERIAS
  { id: "sc_ferias_zonales", channelId: "ch_ferias", name: "FERIAS ZONALES" },
  { id: "sc_ferias_temporales", channelId: "ch_ferias", name: "FERIAS TEMPORALES" },
  // PANADERIA
  { id: "sc_panaderia_zonal", channelId: "ch_panaderia", name: "PANADERIA ZONAL" },
  { id: "sc_panaderia_mayorista", channelId: "ch_panaderia", name: "PANADERIA MAYORISTA" },
];

const channelById = new Map(CHANNELS.map((c) => [c.id, c]));
const subcanalById = new Map(SUBCANALES.map((s) => [s.id, s]));

export function getChannel(id: string): Channel | undefined {
  return channelById.get(id);
}

export function getSubcanal(id: string): Subcanal | undefined {
  return subcanalById.get(id);
}

export function getSubcanalesByChannel(channelId: string): Subcanal[] {
  return SUBCANALES.filter((s) => s.channelId === channelId);
}

/** Channel color with a neutral fallback. */
export function channelColor(channelId: string | undefined): string {
  return (channelId && channelById.get(channelId)?.color) || "#64748b";
}
