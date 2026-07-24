// LayoutDashboard stays imported-commented for the disabled nav item below.
import { ClipboardList, Layers, /* LayoutDashboard, */ Map, Route, Store, Users, type LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  description: string;
  /** Roles allowed to see this item. Omit = visible to every role. */
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  // {
  //   title: "Dashboard",
  //   to: "/",
  //   icon: LayoutDashboard,
  //   description: "Resumen general del microservicio de rutas",
  // },
  {
    title: "Rutas",
    to: "/routes",
    icon: Route,
    description: "Administra las rutas de pre-venta",
  },
  {
    title: "Macrorutas",
    to: "/route-macros",
    icon: Layers,
    description: "Agrupa varias rutas bajo una macroruta",
  },
  {
    title: "Gestionar Mapa",
    to: "/map",
    icon: Map,
    description: "Crea y edita manzanos sobre el mapa",
  },
  {
    title: "Gestión de Mercados",
    to: "/markets",
    icon: Store,
    description: "Mercados con sus manzanos y clientes",
    roles: ["administrador", "supervisor"],
  },
  {
    title: "Vendedores",
    to: "/sellers",
    icon: Users,
    description: "Vendedores y asignación de rutas",
  },
  {
    title: "Tareas por Cliente",
    to: "/client-tasks",
    icon: ClipboardList,
    description: "Asigna tareas a los clientes sobre el mapa",
  },
];

/** Nav items visible to the given role (items without `roles` are always shown). */
export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
