import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import TabContent from "./components/TabContent";
import FieldTeamOrders from "./pages/FieldTeamOrders";
import Bills from "./pages/Bills";
import NotFound from "./pages/NotFound";
import ShellLayout from "./layout/ShellLayout";
import { TabContext } from "./hooks/useTabContext";

const queryClient = new QueryClient();

export default function App() {
  const [selectedTab, setSelectedTab] = useState<string>("properties");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TabContext.Provider value={{ selectedTab, setSelectedTab }}>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ShellLayout>
                    <TabContent />
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
                path="/bills"
                element={
                  <ShellLayout>
                    <Bills />
                  </ShellLayout>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TabContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
