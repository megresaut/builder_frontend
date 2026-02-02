import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import React, { useState } from "react";

import FieldTeamOrders from "./pages/FieldTeamOrders";
import MaintenanceWorkOrders from "./pages/MaintenanceWorkOrders";
import Bills from "./pages/Bills";
import AllProperties from "./pages/AllProperties";
import AllTasks from "./pages/AllTasks";
import RecurringTasks from "./pages/RecurringTasks";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import NotFound from "./pages/NotFound";
import ShellLayout from "./layout/ShellLayout";
import { TabContext } from "./hooks/useTabContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";
import Utilities from "./pages/Utilities_wrong";
import PropertyDetail from "./pages/PropertyDetail";
import BlankPage from "./pages/BlankPage";
import { RecordBill } from "./pages/properties/RecordBill";
import { Auth } from "./pages/Auth";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/Welcome";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import TaskSummary from "./pages/TaskSummary/index";

// FTO
import FtoShellLayout from "./layout/FTOShellLayout";
import FTOHome from "./pages/FTOHome";
import FtoSubmissionForm from "./pages/FtoSubmissionForm";
import ApproveFtoPage from "./pages/ApproveFtoPage";
import FtoInspections from "./pages/FtoInspections";
import FtoInspectionForm from "./pages/FtoInspectionForm";

const queryClient = new QueryClient();

interface TabMetadata {
  label: string;
  sectionId?: string;
  route?: string;
}

// Simple auth gate (unchanged behavior)
const RequireAuth = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const token = localStorage.getItem("avm_token");
  const role = localStorage.getItem("avm_role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role || "")) {
    // Logged in but wrong role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};


export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>("properties");
  const [tabMetadata, setTabMetadataState] = useState<
    Record<string, TabMetadata>
  >({
    properties: { label: "Properties", route: "/" },
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
                {/* ---------- PUBLIC ROUTES ---------- */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* ---------- MAIN APP (ShellLayout) ---------- */}
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AllProperties />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route path="/all-properties" element={<Navigate to="/" replace />} />

                <Route
                  path="/all-tasks"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AllTasks />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/field-team-orders"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <FieldTeamOrders />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/field-team-orders/approve/:ftoId"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <ApproveFtoPage />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                {/* Approve by submission ID (for misc expenses) */}
                <Route
                  path="/field-team-orders/approve/submission/:submissionId"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <ApproveFtoPage />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/work-orders"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <MaintenanceWorkOrders />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/bills"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Bills />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/bills/record"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <RecordBill />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/utilities"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Utilities />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/utilities/view-bill"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <RecordBill />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/property/:propertyId"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <PropertyDetail />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/property/:propertyId/:tab"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <PropertyDetail />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/property/:propertyId/bills/record"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <RecordBill />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/recurring-tasks"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <RecurringTasks />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/vendors"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Vendors />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/vendors/:vendorId"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <VendorDetail />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/task-summary/:taskId/:tab/:workOrderId"
                  element={
                    <ShellLayout>
                      <TaskSummaryWrapper />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/tasks/:taskId/workorders/:workOrderId"
                  element={
                    <ShellLayout>
                      <TaskSummaryWrapper />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/tasks/:taskId/:tab"
                  element={
                    <ShellLayout>
                      <TaskSummaryWrapper />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/tasks/:taskId"
                  element={
                    <ShellLayout>
                      <TaskSummaryWrapper />
                    </ShellLayout>
                  }
                />

                <Route
                  path="/blank"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <BlankPage />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                {/* ---------- FTO APP (FTOShellLayout) ---------- */}
                <Route
                  path="/fto"
                  element={
                    <RequireAuth>
                      <FtoShellLayout>
                        <FTOHome />
                      </FtoShellLayout>
                    </RequireAuth>
                  }
                />


                <Route
                  path="/fto/submission"
                  element={
                    <RequireAuth>
                      <FtoShellLayout>
                        <Outlet />
                      </FtoShellLayout>
                    </RequireAuth>
                  }
                >
                  {/* Create */}
                  <Route index element={<FtoSubmissionForm />} />

                  {/* Edit / View */}
                  <Route path=":submissionId" element={<FtoSubmissionForm />} />
                </Route>

                <Route
                  path="/fto/inspections"
                  element={
                    <RequireAuth>
                      <FtoShellLayout>
                        <Outlet />
                      </FtoShellLayout>
                    </RequireAuth>
                  }
                >
                  {/* List */}
                  <Route index element={<FtoInspections />} />

                  {/* Create */}
                  <Route path="new" element={<FtoInspectionForm />} />

                  {/* Edit / View */}
                  <Route path=":inspectionId" element={<FtoInspectionForm />} />
                </Route>

                {/* ---------- FALLBACK ---------- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TabContext.Provider>
        </FavoritesProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const TaskSummaryWrapper = () => {
  const { taskId } = useParams();
  return <TaskSummary key={taskId} />;
};