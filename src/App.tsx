import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { RoutesListPage } from "@/features/routes/pages/routes-list-page";
import { RouteFormPage } from "@/features/routes/pages/route-form-page";
import { RoutesMapPage } from "@/features/routes/pages/routes-map-page";
import { RouteMacrosListPage } from "@/features/route-macros/pages/route-macros-list-page";
import { RouteMacroFormPage } from "@/features/route-macros/pages/route-macro-form-page";
import { ManageMapPage } from "@/features/map/pages/manage-map-page";
import { MarketsListPage } from "@/features/markets/pages/markets-list-page";
import { MarketFormPage } from "@/features/markets/pages/market-form-page";
import { ClientsPage } from "@/features/clients/pages/clients-page";
import { SellersPage } from "@/features/sellers/pages/sellers-page";
import { SellerDetailPage } from "@/features/sellers/pages/seller-detail-page";
import { SellerAssignRoutePage } from "@/features/sellers/pages/seller-assign-route-page";
import { ClientTasksListPage } from "@/features/client-tasks/pages/client-tasks-list-page";
import { ClientTaskFormPage } from "@/features/client-tasks/pages/client-task-form-page";
import { GeneralTasksListPage } from "@/features/general-tasks/pages/general-tasks-list-page";
import { GeneralTaskFormPage } from "@/features/general-tasks/pages/general-task-form-page";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="routes" element={<RoutesListPage />} />
        <Route path="routes/map" element={<RoutesMapPage />} />
        <Route path="routes/new" element={<RouteFormPage />} />
        <Route path="routes/:id/edit" element={<RouteFormPage />} />
        <Route path="route-macros" element={<RouteMacrosListPage />} />
        <Route path="route-macros/new" element={<RouteMacroFormPage />} />
        <Route path="route-macros/:id/edit" element={<RouteMacroFormPage />} />
        <Route path="map" element={<ManageMapPage />} />
        <Route path="markets" element={<MarketsListPage />} />
        <Route path="markets/new" element={<MarketFormPage />} />
        <Route path="markets/:id/edit" element={<MarketFormPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="sellers" element={<SellersPage />} />
        <Route path="sellers/:code" element={<SellerDetailPage />} />
        <Route path="sellers/:code/assign" element={<SellerAssignRoutePage />} />
        <Route path="client-tasks" element={<ClientTasksListPage />} />
        <Route path="client-tasks/new" element={<ClientTaskFormPage />} />
        <Route path="client-tasks/:id/edit" element={<ClientTaskFormPage />} />
        <Route path="general-tasks" element={<GeneralTasksListPage />} />
        <Route path="general-tasks/new" element={<GeneralTaskFormPage />} />
        <Route path="general-tasks/:id/edit" element={<GeneralTaskFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
