import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";

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
import { TabContext, useTabContext } from "./hooks/useTabContext";
import type { TabMetadata } from "./hooks/useTabContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";
import {
  loadTabState,
  saveTabState,
  getDefaultTabState,
  type PersistedTabState,
} from "./lib/tabPersistence";
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
import FtoWorkOrders from "./pages/FtoWorkOrders";
import FtoWorkOrderDetail from "./pages/FtoWorkOrderDetail";

const queryClient = new QueryClient();

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

function useInitialTabState(): {
  state: PersistedTabState;
  didRestore: boolean;
} {
  const [initial] = useState(() => {
    const loaded = loadTabState();
    if (loaded) return { state: loaded, didRestore: true };
    return { state: getDefaultTabState(), didRestore: false };
  });
  return initial;
}

/** Syncs URL to the selected tab's route when we restored from sessionStorage (so refresh shows correct page). */
function RestoreTabUrlSync({ didRestore }: { didRestore: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedTab, tabMetadata } = useTabContext();
  const doneRef = useRef(false);
  useEffect(() => {
    if (!didRestore || doneRef.current) return;
    const route = tabMetadata[selectedTab]?.route;
    if (route && route !== location.pathname) {
      doneRef.current = true;
      navigate(route, { replace: true });
    }
  }, [didRestore, selectedTab, tabMetadata, location.pathname, navigate]);
  return null;
}

export default function App() {
  const { state: initialState, didRestore } = useInitialTabState();
  const [selectedTab, setSelectedTab] = useState<string>(initialState.selectedTab);
  const [tabMetadata, setTabMetadataState] = useState<Record<string, TabMetadata>>(initialState.tabMetadata);
  const [tabs, setTabsState] = useState<{ id: string; label: string }[]>(initialState.tabs);
  const [openTabsSet, setOpenTabsSet] = useState<Set<string>>(() => new Set(initialState.openTabs));
  const [nextNewTabId, setNextNewTabIdState] = useState(initialState.nextNewTabId);

  const setTabMetadata = (tabId: string, metadata: TabMetadata) => {
    setTabMetadataState((prev) => ({
      ...prev,
      [tabId]: metadata,
    }));
  };

  const setOpenTabs = (
    value: string[] | Set<string> | ((prev: Set<string>) => Set<string>)
  ) => {
    setOpenTabsSet((prev) => {
      if (typeof value === "function") return value(prev);
      const next = value instanceof Set ? value : new Set(value);
      return next.size === prev.size && [...next].every((id) => prev.has(id))
        ? prev
        : next;
    });
  };

  // Persist tab state whenever it changes (debounced would be possible but simple write is fine)
  useEffect(() => {
    saveTabState({
      tabs,
      openTabs: [...openTabsSet],
      selectedTab,
      tabMetadata,
      nextNewTabId,
    });
  }, [tabs, openTabsSet, selectedTab, tabMetadata, nextNewTabId]);

  const tabContextValue = {
    selectedTab,
    setSelectedTab,
    tabMetadata,
    setTabMetadata,
    tabs,
    setTabs: setTabsState,
    openTabs: openTabsSet,
    setOpenTabs,
    nextNewTabId,
    setNextNewTabId: setNextNewTabIdState,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <FavoritesProvider>
          <TabContext.Provider value={tabContextValue}>
            <BrowserRouter>
              <RestoreTabUrlSync didRestore={didRestore} />
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

                <Route
                  path="/fto/work-orders"
                  element={
                    <RequireAuth>
                      <FtoShellLayout>
                        <Outlet />
                      </FtoShellLayout>
                    </RequireAuth>
                  }
                >
                  <Route index element={<FtoWorkOrders />} />
                  <Route path=":workOrderId" element={<FtoWorkOrderDetail />} />
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