import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "@/components/common/command-palette";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {/* main is a definite-height flex column; the wrapper is the scroll
            container (flex-1 of main). That gives "fit" pages a real height to
            fill with flex-1 (maps resolve h-full), while taller pages scroll here. */}
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full min-h-0 max-w-[1800px] flex-1 flex-col overflow-y-auto px-2 py-3 sm:px-3 lg:px-4 lg:py-4 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
