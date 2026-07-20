import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const AdminLayout = React.lazy(() => import("./layouts/AdminLayout.tsx").then(m => ({ default: m.AdminLayout })));
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard.tsx"));
const RoutesManager = React.lazy(() => import("./pages/admin/RoutesManager.tsx"));
const StopsManager = React.lazy(() => import("./pages/admin/StopsManager.tsx"));
const BusesManager = React.lazy(() => import("./pages/admin/BusesManager.tsx"));
const SchedulesManager = React.lazy(() => import("./pages/admin/SchedulesManager.tsx"));
const FaresManager = React.lazy(() => import("./pages/admin/FaresManager.tsx"));
const BookingsManager = React.lazy(() => import("./pages/admin/BookingsManager.tsx"));
const PaymentsManager = React.lazy(() => import("./pages/admin/PaymentsManager.tsx"));
const UsersManager = React.lazy(() => import("./pages/admin/UsersManager.tsx"));
const FeedbackManager = React.lazy(() => import("./pages/admin/FeedbackManager.tsx"));
const SettingsManager = React.lazy(() => import("./pages/admin/SettingsManager.tsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background text-foreground">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="routes" element={<RoutesManager />} />
                  <Route path="stops" element={<StopsManager />} />
                  <Route path="buses" element={<BusesManager />} />
                  <Route path="schedules" element={<SchedulesManager />} />
                  <Route path="fares" element={<FaresManager />} />
                  <Route path="bookings" element={<BookingsManager />} />
                  <Route path="payments" element={<PaymentsManager />} />
                  <Route path="users" element={<UsersManager />} />
                  <Route path="feedback" element={<FeedbackManager />} />
                  <Route path="settings" element={<SettingsManager />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
