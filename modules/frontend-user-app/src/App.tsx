import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import { InstallPrompt } from "@/components/InstallPrompt";

const FavoritesPage = React.lazy(() => import("./pages/FavoritesPage.tsx"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage.tsx"));
const MyTicketsPage = React.lazy(() => import("./pages/MyTicketsPage.tsx"));
const MyScannedTicketsPage = React.lazy(() => import("./pages/MyScannedTicketsPage.tsx"));
const TicketPage = React.lazy(() => import("./pages/TicketPage.tsx"));
const PaymentSuccessPage = React.lazy(() => import("./pages/PaymentSuccessPage.tsx"));
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
          <InstallPrompt />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/tickets" element={<MyTicketsPage />} />
                <Route path="/scanned-tickets" element={<MyScannedTicketsPage />} />
                <Route path="/ticket/:ticketCode" element={<TicketPage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />

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
