import { ChevronsLeft, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex",
        sidebarCollapsed ? "w-[68px]" : "w-48",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-sidebar-border px-4",
          sidebarCollapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Handshake className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">SALES</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={sidebarCollapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn("w-full justify-start gap-3 text-muted-foreground", sidebarCollapsed && "justify-center")}
        >
          <ChevronsLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
          {!sidebarCollapsed && <span>Colapsar</span>}
        </Button>
      </div>
    </aside>
  );
}
