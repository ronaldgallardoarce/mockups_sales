import { LayoutDashboard, Map, Route, Store, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    description: "Resumen general del microservicio de rutas",
  },
  {
    title: "Rutas",
    to: "/routes",
    icon: Route,
    description: "Administra las rutas de pre-venta",
  },
  {
    title: "Gestionar Mapa",
    to: "/map",
    icon: Map,
    description: "Crea y edita manzanos sobre el mapa",
  },
  {
    title: "Mercados/Clientes",
    to: "/clients",
    icon: Store,
    description: "Clientes por canal y subcanal",
  },
];
