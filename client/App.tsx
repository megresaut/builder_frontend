// import "./global.css";

// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import React, { useState } from "react";
// import TabContent from "./components/TabContent";
// import FieldTeamOrders from "./pages/FieldTeamOrders";
// import WorkOrders from "./pages/WorkOrders";
// import MaintenanceWorkOrders from "./pages/MaintenanceWorkOrders";
// import Bills from "./pages/Bills";
// import AllProperties from "./pages/AllProperties";
// import AllTasks from "./pages/AllTasks";
// import TaskSummary from "./pages/TaskSummary";
// import RecurringTasks from "./pages/RecurringTasks";
// import Vendors from "./pages/Vendors";
// import NotFound from "./pages/NotFound";
// import ShellLayout from "./layout/ShellLayout";
// import { TabContext } from "./hooks/useTabContext";
// import { FavoritesProvider } from "./hooks/FavoritesContext";
// import Utilities from "./pages/Utilities";
// import PropertyDetail from "./pages/PropertyDetail";
// import BlankPage from "./pages/BlankPage";
// import { RecordBill } from "./pages/properties/RecordBill";
// import { Auth } from "./pages/Auth";
// import { Login } from "./pages/Login";
// import { Welcome } from "./pages/Welcome";
// import { PrivacyPolicy } from "./pages/PrivacyPolicy";
// import { TermsOfService } from "./pages/TermsOfService";

// const queryClient = new QueryClient();

// interface TabMetadata {
//   label: string;
//   sectionId?: string;
//   route?: string;
// }

// export default function App() {
//   const [selectedTab, setSelectedTab] = useState<string>("properties");
//   const [tabMetadata, setTabMetadataState] = useState<
//     Record<string, TabMetadata>
//   >({
//     properties: { label: "Properties", route: "/all-properties" },
//     portfolio: { label: "Portfolio", sectionId: "portfolio" },
//     screening: { label: "Screening", sectionId: "screening" },
//     bills: { label: "Bills", sectionId: "bills" },
//     "field-team-orders": {
//       label: "Field Team Orders",
//       sectionId: "field-team-orders",
//     },
//     "work-orders": { label: "Work Orders", sectionId: "work-orders" },
//   });

//   const setTabMetadata = (tabId: string, metadata: TabMetadata) => {
//     setTabMetadataState((prev) => ({
//       ...prev,
//       [tabId]: metadata,
//     }));
//   };
  
//   const RequireAuth = ({ children }: { children: JSX.Element }) => {
//     const token = localStorage.getItem("avm_token");
//     if (!token) {
//       return <Navigate to="/login" replace />;
//     }
//     return children;
//   };
  
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <FavoritesProvider>
//           <TabContext.Provider
//             value={{ selectedTab, setSelectedTab, tabMetadata, setTabMetadata }}
//           >
//             <BrowserRouter>
//               <Routes>
//                 <Route
//                   path="/"
//                   element={
//                     <ShellLayout>
//                       <AllTasks />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/field-team-orders"
//                   element={
//                     <ShellLayout>
//                       <FieldTeamOrders />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/work-orders"
//                   element={
//                     <ShellLayout>
//                       <MaintenanceWorkOrders />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/bills"
//                   element={
//                     <ShellLayout>
//                       <Bills />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/all-properties"
//                   element={
//                     <ShellLayout>
//                       <AllProperties />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/utilities"
//                   element={
//                     <ShellLayout>
//                       <Utilities />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/utilities/view-bill"
//                   element={
//                     <ShellLayout>
//                       <RecordBill />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/property/:propertyId"
//                   element={
//                     <ShellLayout>
//                       <PropertyDetail />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/property/:propertyId/:tab"
//                   element={
//                     <ShellLayout>
//                       <PropertyDetail />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/property/:propertyId/bills/record"
//                   element={
//                     <ShellLayout>
//                       <RecordBill />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/bills/record"
//                   element={
//                     <ShellLayout>
//                       <RecordBill />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/all-tasks"
//                   element={
//                     <ShellLayout>
//                       <AllTasks />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/recurring-tasks"
//                   element={
//                     <ShellLayout>
//                       <RecurringTasks />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/vendors"
//                   element={
//                     <ShellLayout>
//                       <Vendors />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/tasks/:taskId/:tab/:workOrderId"
//                   element={
//                     <ShellLayout>
//                       <TaskSummary />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/tasks/:taskId/:tab"
//                   element={
//                     <ShellLayout>
//                       <TaskSummary />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/tasks/:taskId"
//                   element={
//                     <ShellLayout>
//                       <TaskSummary />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route
//                   path="/blank"
//                   element={
//                     <ShellLayout>
//                       <BlankPage />
//                     </ShellLayout>
//                   }
//                 />
//                 <Route path="/auth" element={<Auth />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/welcome" element={<Welcome />} />
//                 <Route path="/privacy-policy" element={<PrivacyPolicy />} />
//                 <Route path="/terms-of-service" element={<TermsOfService />} />
//                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//                 <Route path="*" element={<NotFound />} />
//               </Routes>
//             </BrowserRouter>
//           </TabContext.Provider>
//         </FavoritesProvider>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import React, { useState } from "react";

import FieldTeamOrders from "./pages/FieldTeamOrders";
import MaintenanceWorkOrders from "./pages/MaintenanceWorkOrders";
import Bills from "./pages/Bills";
import AllProperties from "./pages/AllProperties";
import AllTasks from "./pages/AllTasks";
import TaskSummary from "./pages/TaskSummary";
import RecurringTasks from "./pages/RecurringTasks";
import Vendors from "./pages/Vendors";
import NotFound from "./pages/NotFound";
import ShellLayout from "./layout/ShellLayout";
import BareLayout from "./layout/BareLayout";
import { TabContext } from "./hooks/useTabContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";
import Utilities from "./pages/Utilities";
import PropertyDetail from "./pages/PropertyDetail";
import BlankPage from "./pages/BlankPage";
import { RecordBill } from "./pages/properties/RecordBill";
import { Auth } from "./pages/Auth";
import { Login } from "./pages/Login";
import { Welcome } from "./pages/Welcome";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";

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

const ProtectedShell = () => (
  <ShellLayout>
    <Outlet />
  </ShellLayout>
);

export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>("properties");
  const [tabMetadata, setTabMetadataState] = useState<Record<string, TabMetadata>>({
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
                {/* -------- PUBLIC ROUTES (NO AUTH) -------- */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* -------- PROTECTED ROUTES -------- */}
                <Route element={<RequireAuth />}>
                  {/* ALL authenticated pages use ShellLayout */}
                  <Route element={<ProtectedShell />}>
                    <Route path="/" element={<AllTasks />} />
                    <Route path="/all-tasks" element={<AllTasks />} />
                    <Route path="/field-team-orders" element={<FieldTeamOrders />} />
                    <Route path="/work-orders" element={<MaintenanceWorkOrders />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/all-properties" element={<AllProperties />} />

                    <Route path="/utilities" element={<Utilities />} />
                    <Route path="/utilities/view-bill" element={<RecordBill />} />

                    <Route path="/property/:propertyId" element={<PropertyDetail />} />
                    <Route
                      path="/property/:propertyId/:tab"
                      element={<PropertyDetail />}
                    />
                    <Route
                      path="/property/:propertyId/bills/record"
                      element={<RecordBill />}
                    />

                    <Route path="/bills/record" element={<RecordBill />} />

                    <Route path="/recurring-tasks" element={<RecurringTasks />} />
                    <Route path="/vendors" element={<Vendors />} />

                    <Route
                      path="/tasks/:taskId/:tab/:workOrderId"
                      element={<TaskSummary />}
                    />
                    <Route path="/tasks/:taskId/:tab" element={<TaskSummary />} />
                    <Route path="/tasks/:taskId" element={<TaskSummary />} />

                    <Route path="/blank" element={<BlankPage />} />

                    {/* Catch-all for protected routes */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>

                {/* Catch-all for routes not matched anywhere */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TabContext.Provider>
        </FavoritesProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
