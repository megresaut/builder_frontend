import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import React, { useState } from "react";
import TabContent from "./components/TabContent";
import FieldTeamOrders from "./pages/FieldTeamOrders";
import WorkOrders from "./pages/WorkOrders";
import MaintenanceWorkOrders from "./pages/MaintenanceWorkOrders";
import Bills from "./pages/Bills";
import AllProperties from "./pages/AllProperties";
import AllTasks from "./pages/AllTasks";
import TaskSummary from "./pages/TaskSummary/index";
import RecurringTasks from "./pages/RecurringTasks";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import NotFound from "./pages/NotFound";
import ShellLayout from "./layout/ShellLayout";
import FtoShellLayout from "./layout/FtoShellLayout";
import { TabContext } from "./hooks/useTabContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";
import PropertyDetail from "./pages/properties/PropertyDetail";
import InspectionDetail from "./pages/properties/InspectionDetail";
import BlankPage from "./pages/BlankPage";
import { RecordBill } from "./pages/properties/RecordBill";
import { Auth } from "./pages/Auth";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/Welcome";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import FtoHome from "./pages/FtoHome";
import FtoSubmissionForm from "./pages/FtoSubmissionForm";
import FtoInspections from "./pages/FtoInspections";
import FtoInspectionForm from "./pages/FtoInspectionForm";
import ApproveFTOPage from "./pages/ApproveFTOPage";

const queryClient = new QueryClient();

interface TabMetadata {
  label: string;
  sectionId?: string;
  route?: string;
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/fto")) return "field-team-orders";
      if (path === "/bills" || path.startsWith("/bills/")) return "bills";
      if (path === "/work-orders") return "work-orders";
      if (path.startsWith("/all-tasks") || path.startsWith("/tasks/"))
        return "field-team-orders";
    }
    return "properties";
  });
  const [tabMetadata, setTabMetadataState] = useState<
    Record<string, TabMetadata>
  >(() => {
    const defaultMetadata = {
      properties: { label: "Properties", route: "/all-properties" },
      portfolio: { label: "Portfolio", route: "/" },
      screening: { label: "Screening", route: "/" },
      bills: { label: "Bills", route: "/bills" },
      "field-team-orders": {
        label: "Field Team Orders",
        route: "/field-team-orders",
      },
      "work-orders": { label: "Work Orders", route: "/work-orders" },
    };

    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/fto")) {
        defaultMetadata["field-team-orders"].route = path;
      }
    }

    return defaultMetadata;
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
        <ToastProvider>
          <Toaster />
          <Sonner />
          <FavoritesProvider>
            <TabContext.Provider
              value={{ selectedTab, setSelectedTab, tabMetadata, setTabMetadata }}
            >
              <BrowserRouter>
                <Routes>
                  <Route
                  path="/"
                  element={
                    <ShellLayout>
                      <AllTasks />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/field-team-orders"
                  element={
                    <ShellLayout>
                      <FieldTeamOrders />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/work-orders"
                  element={
                    <ShellLayout>
                      <MaintenanceWorkOrders />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/bills/record"
                  element={
                    <ShellLayout>
                      <RecordBill />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/bills"
                  element={
                    <ShellLayout>
                      <Bills />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/utilities/view-bill"
                  element={
                    <ShellLayout>
                      <RecordBill />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/all-properties"
                  element={
                    <ShellLayout>
                      <AllProperties />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId/bills/record"
                  element={
                    <ShellLayout>
                      <RecordBill />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId/inspections/new"
                  element={
                    <ShellLayout>
                      <InspectionDetail isNew />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId/inspections/:inspectionId/edit"
                  element={
                    <ShellLayout>
                      <InspectionDetail isEdit />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId/inspections/:inspectionId/*"
                  element={
                    <ShellLayout>
                      <InspectionDetail />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId/:tab"
                  element={
                    <ShellLayout>
                      <PropertyDetail />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/property/:propertyId"
                  element={
                    <ShellLayout>
                      <PropertyDetail />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/all-tasks"
                  element={
                    <ShellLayout>
                      <AllTasks />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/recurring-tasks"
                  element={
                    <ShellLayout>
                      <RecurringTasks />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/vendors/:vendorId"
                  element={
                    <ShellLayout>
                      <VendorDetail />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/vendors"
                  element={
                    <ShellLayout>
                      <Vendors />
                    </ShellLayout>
                  }
                />
                <Route
                  path="/tasks/:taskId/:tab/:workOrderId"
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
                    <ShellLayout>
                      <BlankPage />
                    </ShellLayout>
                  }
                />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route
                  path="/fto"
                  element={
                    <FtoShellLayout>
                      <FtoHome />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/submission/:ftoId"
                  element={
                    <FtoShellLayout>
                      <FtoSubmissionForm />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/submission"
                  element={
                    <FtoShellLayout>
                      <FtoSubmissionForm />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/inspections"
                  element={
                    <FtoShellLayout>
                      <FtoInspections />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/inspections/new"
                  element={
                    <FtoShellLayout>
                      <FtoInspectionForm />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/inspections/:inspectionId"
                  element={
                    <FtoShellLayout>
                      <FtoInspectionForm />
                    </FtoShellLayout>
                  }
                />
                <Route
                  path="/fto/approve/:ftoId"
                  element={<ApproveFTOPage />}
                />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TabContext.Provider>
          </FavoritesProvider>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const TaskSummaryWrapper = () => {
  const { taskId } = useParams();
  return <TaskSummary key={taskId} />;
};
