import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";

/**
 * Mock authentication: one user per role. In a real app the role would come
 * from the login/JWT; here it can be switched from the user menu to preview how
 * each role sees the app.
 */
export const USERS: User[] = [
  { id: "u_admin", name: "Daniel Durán", email: "danielduran@grupovenado.com", role: "administrador" },
  { id: "u_supervisor", name: "Sergio Peña", email: "sergiopena@grupovenado.com", role: "supervisor", channelName: "TRADICIONAL" },
  { id: "u_vendedor", name: "Verónica López", email: "veronicalopez@grupovenado.com", role: "vendedor" },
];

interface SessionState {
  userId: string;
  setUserId: (id: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: USERS[0].id,
      setUserId: (userId) => set({ userId }),
    }),
    { name: "route-mgmt-session" },
  ),
);

/** The currently signed-in user (falls back to the first user). */
export function useCurrentUser(): User {
  const userId = useSessionStore((s) => s.userId);
  return USERS.find((u) => u.id === userId) ?? USERS[0];
}

/** Current role convenience hook. */
export function useRole(): Role {
  return useCurrentUser().role;
}

/** Two-letter initials for an avatar fallback. */
export function initialsOf(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Human label for a role. */
export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  supervisor: "Supervisor",
  vendedor: "Vendedor",
};

/** Roles allowed to open the "Gestión de Mercados" section. */
export const MARKETS_VIEW_ROLES: Role[] = ["administrador", "supervisor"];
/** Only administrators can create / draw / edit markets. */
export const MARKETS_EDIT_ROLES: Role[] = ["administrador"];

export const canViewMarkets = (role: Role) => MARKETS_VIEW_ROLES.includes(role);
export const canEditMarkets = (role: Role) => MARKETS_EDIT_ROLES.includes(role);
