import { Check, LogOut, Settings, User, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ROLE_LABELS,
  USERS,
  initialsOf,
  useCurrentUser,
  useSessionStore,
} from "@/stores/session-store";

export function UserMenu() {
  const user = useCurrentUser();
  const setUserId = useSessionStore((s) => s.setUserId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 pl-1.5 pr-2">
          <Avatar>
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {ROLE_LABELS[user.role]}
              {user.channelName ? ` · ${user.channelName}` : ""}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User /> Perfil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings /> Preferencias
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <UsersRound className="h-3 w-3" /> Cambiar usuario (demo)
        </DropdownMenuLabel>
        {USERS.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => setUserId(u.id)}
            className={cn(u.id === user.id && "bg-accent/60")}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{initialsOf(u.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{u.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{ROLE_LABELS[u.role]}</span>
            </div>
            {u.id === user.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
