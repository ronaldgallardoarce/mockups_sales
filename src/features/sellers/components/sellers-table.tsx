import { Mail, MapPinned, Phone } from "lucide-react";
import type { Seller } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SellerStatusBadge } from "./seller-status-badge";
import { SellerActions } from "./seller-actions";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

interface SellersTableProps {
  sellers: Seller[];
  loading?: boolean;
  onAssignRoute: (seller: Seller) => void;
}

export function SellersTable({ sellers, loading, onAssignRoute }: SellersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Vendedor</TableHead>
            <TableHead className="hidden lg:table-cell">Contacto</TableHead>
            <TableHead className="w-32">Rutas</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            : sellers.map((seller) => (
                <TableRow
                  key={seller.code}
                  className="group cursor-pointer"
                  onClick={() => onAssignRoute(seller)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(seller.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{seller.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{seller.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {seller.email}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {seller.phone ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {seller.routeAssignments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium">
                        <MapPinned className="h-3 w-3" />
                        {seller.routeAssignments.length}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin rutas</span>
                    )}
                  </TableCell>
                  <TableCell><SellerStatusBadge status={seller.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <SellerActions seller={seller} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
