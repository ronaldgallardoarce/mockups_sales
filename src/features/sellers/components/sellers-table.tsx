import { Mail, Phone } from "lucide-react";
import type { Seller } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SellerStatusBadge } from "./seller-status-badge";
import { SellerActions } from "./seller-actions";

interface SellersTableProps {
  sellers: Seller[];
  loading?: boolean;
  onAssignRoute: (seller: Seller) => void;
}

export function SellersTable({ sellers, loading, onAssignRoute }: SellersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="text-[13px] [&_td]:py-2">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-28">Código</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell w-44">Teléfono</TableHead>
            <TableHead className="w-40">Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {seller.code}
                  </TableCell>
                  <TableCell className="font-medium">{seller.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" /> {seller.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" /> {seller.phone ?? "—"}
                    </span>
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
