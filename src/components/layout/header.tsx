import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useUIStore } from "@/stores/ui-store";
import { Breadcrumbs } from "./breadcrumbs";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function Header() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MobileNav />
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="hidden gap-2 text-muted-foreground sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>Buscar…</span>
          <kbd className="pointer-events-none ml-2 hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium md:inline-flex">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Buscar"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
