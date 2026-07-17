import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { RoutesListPage } from "@/features/routes/pages/routes-list-page";
import { RouteFormPage } from "@/features/routes/pages/route-form-page";
import { RouteMacrosListPage } from "@/features/route-macros/pages/route-macros-list-page";
import { RouteMacroFormPage } from "@/features/route-macros/pages/route-macro-form-page";
import { ManageMapPage } from "@/features/map/pages/manage-map-page";
import { ClientsPage } from "@/features/clients/pages/clients-page";
import { SellersPage } from "@/features/sellers/pages/sellers-page";
import { SellerAssignRoutePage } from "@/features/sellers/pages/seller-assign-route-page";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="routes" element={<RoutesListPage />} />
        <Route path="routes/new" element={<RouteFormPage />} />
        <Route path="routes/:id/edit" element={<RouteFormPage />} />
        <Route path="route-macros" element={<RouteMacrosListPage />} />
        <Route path="route-macros/new" element={<RouteMacroFormPage />} />
        <Route path="route-macros/:id/edit" element={<RouteMacroFormPage />} />
        <Route path="map" element={<ManageMapPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="sellers" element={<SellersPage />} />
        <Route path="sellers/:code/assign" element={<SellerAssignRoutePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
