import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";

const SEGMENT_LABELS: Record<string, string> = {
  routes: "Rutas",
  map: "Gestionar Mapa",
  clients: "Mercados/Clientes",
  new: "Nueva",
  edit: "Editar",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const root =
    NAV_ITEMS.find((n) => n.to === "/" + (segments[0] ?? "")) ??
    NAV_ITEMS.find((n) => n.to === "/");

  const crumbs = [
    { label: root?.title ?? "Dashboard", to: root?.to ?? "/" },
    ...segments.slice(1).map((seg, i) => ({
      label: SEGMENT_LABELS[seg] ?? decodeURIComponent(seg),
      to: "/" + segments.slice(0, i + 2).join("/"),
    })),
  ];

  return (
    <nav aria-label="Migas de pan" className="hidden items-center gap-1.5 text-sm sm:flex">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
            {last ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
