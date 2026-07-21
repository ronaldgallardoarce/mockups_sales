import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Plus, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ColorDot } from "@/components/common/channel-badge";
import { navItemsForRole } from "@/config/nav";
import { useUIStore } from "@/stores/ui-store";
import { useThemeStore } from "@/stores/theme-store";
import { useRole } from "@/stores/session-store";
import { useRoutes } from "@/hooks/use-routes";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const { toggleTheme, theme } = useThemeStore();
  const navigate = useNavigate();
  const role = useRole();
  const { data: routes = [] } = useRoutes();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  const run = (fn: () => void) => {
    setCommandOpen(false);
    fn();
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Buscar rutas, páginas o acciones…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          {navItemsForRole(role).map((item) => (
            <CommandItem
              key={item.to}
              value={`nav ${item.title}`}
              onSelect={() => run(() => navigate(item.to))}
            >
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Acciones">
          <CommandItem value="nueva ruta crear" onSelect={() => run(() => navigate("/routes/new"))}>
            <Plus /> Nueva ruta
          </CommandItem>
          <CommandItem value="tema modo oscuro claro" onSelect={() => run(toggleTheme)}>
            {theme === "dark" ? <Sun /> : <Moon />}
            Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}
          </CommandItem>
        </CommandGroup>

        {routes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Rutas">
              {routes.slice(0, 8).map((route) => (
                <CommandItem
                  key={route.id}
                  value={`ruta ${route.name}`}
                  onSelect={() => run(() => navigate(`/routes/${route.id}/edit`))}
                >
                  <ColorDot color={route.color} />
                  {route.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
