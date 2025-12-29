import "./global.css";

import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import ShellLayout from "./layout/ShellLayout";
import FTOShellLayout from "./layout/FTOShellLayout";

import { TabContext } from "./hooks/useTabContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";

import FieldTeamOrders from "./pages/FieldTeamOrders";
import MaintenanceWorkOrders from "./pages/MaintenanceWorkOrders";
import Bills from "./pages/Bills";
import AllProperties from "./pages/AllProperties";
import AllTasks from "./pages/AllTasks";
import TaskSummary from "./pages/TaskSummary";
import RecurringTasks from "./pages/RecurringTasks";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import Utilities from "./pages/Utilities_wrong";
import PropertyDetail from "./pages/PropertyDetail";
import BlankPage from "./pages/BlankPage";
import NotFound from "./pages/NotFound";

import { RecordBill } from "./pages/properties/RecordBill";
import { Auth } from "./pages/Auth";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/Welcome";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";

import FTOHome from "./pages/FTOHome";

const queryClient = new QueryClient();

interface TabMetadata {
  label: string;
  sectionId?: string;
  route?: string;
}

const RequireAuth = () => {
  const token = localStorage.getItem("avm_token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>("properties");
  const [tabMetadata, setTabMetadataState] = useState<
    Record<string, TabMetadata>
  >({
    properties: { label: "Properties", route: "/all-properties" },
    portfolio: { label: "Portfolio", sectionId: "portfolio" },
    screening: { label: "Screening", sectionId: "screening" },
    bills: { label: "Bills", sectionId: "bills" },
    "field-team-orders": {
      label: "Field Team Orders",
      sectionId: "field-team-orders",
    },
    "work-orders": { label: "Work Orders", sectionId: "work-orders" },
  });

  const setTabMetadata = (tabId: string, metadata: TabMetadata) => {
    setTabMetadataState((prev) => ({
      ...prev,
      [tabId]: metadata,
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <FavoritesProvider>
          <TabContext.Provider
            value={{ selectedTab, setSelectedTab, tabMetadata, setTabMetadata }}
          >
            <BrowserRouter>
              <Routes>
                {/* -------- PUBLIC ROUTES -------- */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* -------- AUTH REQUIRED -------- */}
                <Route element={<RequireAuth />}>

                  {/* ===== MAIN APP (ShellLayout) ===== */}
                  <Route element={<ShellLayout />}>
                    <Route path="/" element={<AllTasks />} />
                    <Route path="/all-tasks" element={<AllTasks />} />
                    <Route
                      path="/field-team-orders"
                      element={<FieldTeamOrders />}
                    />
                    <Route
                      path="/work-orders"
                      element={<MaintenanceWorkOrders />}
                    />
                    <Route path="/bills" element={<Bills />} />
                    <Route
                      path="/all-properties"
                      element={<AllProperties />}
                    />

                    <Route path="/utilities" element={<Utilities />} />
                    <Route
                      path="/utilities/view-bill"
                      element={<RecordBill />}
                    />

                    <Route
                      path="/property/:propertyId"
                      element={<PropertyDetail />}
                    />
                    <Route
                      path="/property/:propertyId/:tab"
                      element={<PropertyDetail />}
                    />
                    <Route
                      path="/property/:propertyId/bills/record"
                      element={<RecordBill />}
                    />

                    <Route path="/bills/record" element={<RecordBill />} />

                    <Route
                      path="/recurring-tasks"
                      element={<RecurringTasks />}
                    />
                    <Route path="/vendors" element={<Vendors />} />

                    <Route
                      path="/tasks/:taskId/:tab/:workOrderId"
                      element={<TaskSummary />}
                    />
                    <Route
                      path="/tasks/:taskId/:tab"
                      element={<TaskSummary />}
                    />
                    <Route
                      path="/tasks/:taskId"
                      element={<TaskSummary />}
                    />

                    <Route path="/blank" element={<BlankPage />} />
                  </Route>

                  {/* ===== FIELD TEAM PORTAL (FTOShellLayout) ===== */}
                  <Route element={<FTOShellLayout />}>
                    <Route path="/fto" element={<FTOHome />} />
                  </Route>

                </Route>

                {/* -------- FALLBACK -------- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TabContext.Provider>
        </FavoritesProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
