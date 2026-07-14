import { Menu, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUIStore } from "@/stores/ui-store";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RouteIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Gestión de Rutas</p>
            <p className="text-xs text-muted-foreground">Pre-Venta · Beni</p>
          </div>
        </div>
        <div className="py-4">
          <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
