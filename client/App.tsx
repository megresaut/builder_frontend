import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useAuth } from "./auth/useAuth";
import { isMobileDevice } from "./lib/detectMobile";

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
import PropertyLayout, { PropertyTabContent } from "./pages/PropertyDetail";
import BlankPage from "./pages/BlankPage";
import { RecordBill } from "./pages/properties/RecordBill";
import { Auth } from "./pages/Auth";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/Welcome";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import TaskSummary from "./pages/TaskSummary/index";
import AIDrafts from "./pages/AIDrafts";
import Operations from "./pages/Operations";
import ActivityFeed from "./pages/ActivityFeed";
import InsuranceDashboard from "./pages/InsuranceDashboard";
import InspectionDashboard from "./pages/InspectionDashboard";
import VendorComplianceDashboard from "./pages/VendorComplianceDashboard";
import Dashboard from "./pages/Dashboard";
import PhotoGalleryDemo from "./pages/PhotoGalleryDemo";
import SettingsLayout from "./pages/settings/SettingsLayout";
import BugReports from "./pages/settings/BugReports";
import BugReportDetail from "./pages/settings/BugReportDetail";
import SettingsStub from "./pages/settings/SettingsStub";
import { initConsoleCapture } from "./lib/consoleCapture";
import AccountingDashboard from "./pages/AccountingDashboard";
import AccountingStatements from "./pages/AccountingStatements";
import AccountingStatementReconcile from "./pages/AccountingStatementReconcile";
import AccountingQBOSettings from "./pages/AccountingQBOSettings";
import AccountingInvoices from "./pages/AccountingInvoices";
import AccountingInvoiceDetail from "./pages/AccountingInvoiceDetail";
import AccountingTransactions from "./pages/AccountingTransactions";
import AccountingChartOfAccounts from "./pages/AccountingChartOfAccounts";
import AccountingPnL from "./pages/AccountingPnL";
import AccountingARaging from "./pages/AccountingARaging";
import AccountingPropertyComparison from "./pages/AccountingPropertyComparison";

initConsoleCapture();

// FTO testing
import FtoShellLayout from "./layout/FTOShellLayout";
import FTOHome from "./pages/FTOHome";
import FTODashboard from "./pages/FTODashboard";
import FtoSubmissionForm from "./pages/FtoSubmissionForm";
import ApproveFtoPage from "./pages/ApproveFtoPage";
import FtoInspections from "./pages/FtoInspections";
import FtoInspectionForm from "./pages/FtoInspectionForm";
import FtoInspectionCreate from "./pages/FtoInspectionCreate";
import FtoInspectionDetail from "./pages/FtoInspectionDetail";
import FtoInspectionRunner from "./pages/FtoInspectionRunner";
import FtoWorkOrders from "./pages/FtoWorkOrders";
import FtoWorkOrderDetail from "./pages/FtoWorkOrderDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Auth gate — validates in-memory token + attempts refresh on load
const RequireAuth = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Still checking token / attempting refresh — show nothing to avoid flash
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Mobile/tablet users only use the FTO portal. Catches cached-session
  // deep links into admin routes; login-time redirect lives in Login.tsx.
  if (isMobileDevice() && !location.pathname.startsWith("/fto")) {
    return <Navigate to="/fto" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role || "")) {
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

/** Listens for auth:session-expired events dispatched by fetchJSON when token refresh fails.
 *  Uses React Router's navigate so the transition is smooth (no full page reload / blank flash). */
function SessionExpiryHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => navigate("/login", { replace: true });
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [navigate]);
  return null;
}

/** Syncs URL to the selected tab's route when we restored from sessionStorage (so refresh shows correct page).
 *  Runs in useLayoutEffect so the URL is corrected before first paint, avoiding a visible "refresh" when returning to the tab. */
function RestoreTabUrlSync({ didRestore }: { didRestore: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedTab, tabMetadata } = useTabContext();
  const doneRef = useRef(false);
  useLayoutEffect(() => {
    if (!didRestore || doneRef.current) return;
    // Only override URL when user landed on root; don't redirect away from /fto or other direct links
    if (location.pathname !== "/" && location.pathname !== "") return;
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

  const setTabMetadata = useCallback((tabId: string, metadata: TabMetadata) => {
    setTabMetadataState((prev) => {
      const existing = prev[tabId] || {};
      return {
        ...prev,
        [tabId]: {
          ...existing,
          ...metadata,
          pageState: {
            ...(existing.pageState || {}),
            ...(metadata.pageState || {}),
          },
        },
      };
    });
  }, []);

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
              <SessionExpiryHandler />
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
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Dashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Dashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/all-properties"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AllProperties />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

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
                  path="/insurance"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <InsuranceDashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/inspection-dashboard"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <InspectionDashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingDashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/statements"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingStatements />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/statements/:id"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingStatementReconcile />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/qbo"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingQBOSettings />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/invoices"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingInvoices />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/invoices/:id"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingInvoiceDetail />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/transactions"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingTransactions />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/chart-of-accounts"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingChartOfAccounts />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/reports/pnl"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingPnL />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/reports/ar-aging"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingARaging />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/accounting/reports/property-comparison"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <AccountingPropertyComparison />
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
                  path="/property/:propertyId"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <PropertyLayout />
                      </ShellLayout>
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="Overview" replace />} />
                  <Route path=":tab" element={<PropertyTabContent />} />
                </Route>

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
                  path="/vendor-compliance"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <VendorComplianceDashboard />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/ai-drafts"
                  element={
                    <RequireAuth allowedRoles={["admin", "property_manager"]}>
                      <ShellLayout>
                        <AIDrafts />
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
                  path="/operations"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <Operations />
                      </ShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/activity-feed"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <ActivityFeed />
                      </ShellLayout>
                    </RequireAuth>
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

                {/* ---------- SETTINGS ---------- */}
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <ShellLayout>
                        <SettingsLayout />
                      </ShellLayout>
                    </RequireAuth>
                  }
                >
                  <Route index element={<Navigate to="bugs" replace />} />
                  <Route path="bugs" element={<BugReports />} />
                  <Route path="bugs/:bugId" element={<BugReportDetail />} />
                  <Route path="profile" element={<SettingsStub title="Profile" />} />
                  <Route path="notifications" element={<SettingsStub title="Notifications" />} />
                  <Route path="integrations" element={<SettingsStub title="Integrations" />} />
                </Route>

                {/* ---------- DEV / DESIGN PREVIEWS ---------- */}
                <Route path="/dev/photo-gallery" element={<PhotoGalleryDemo />} />

                {/* ---------- FTO APP (FTOShellLayout) ---------- */}
                <Route
                  path="/fto"
                  element={
                    <RequireAuth>
                      <FtoShellLayout>
                        <FTODashboard />
                      </FtoShellLayout>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/fto/orders"
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
                  <Route path="new" element={<FtoInspectionCreate />} />

                  {/* Detail / Start */}
                  <Route path=":inspectionId" element={<FtoInspectionDetail />} />
                </Route>

                {/* Inspection Runner - full screen, outside shell layout */}
                <Route
                  path="/fto/inspections/:inspectionId/run"
                  element={
                    <RequireAuth>
                      <FtoInspectionRunner />
                    </RequireAuth>
                  }
                />

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
