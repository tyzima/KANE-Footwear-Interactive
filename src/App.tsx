import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ShopifyAdmin from "./pages/ShopifyAdmin";
import ShopifyCallback from "./pages/ShopifyCallback";
import ShopifyEmbeddedPage from "./pages/ShopifyEmbedded";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize theme system - this will apply the dark class to document
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/shopify-admin" element={<ShopifyAdmin />} />
            <Route path="/auth/shopify/callback" element={<ShopifyCallback />} />
            <Route path="/shopify-embedded" element={<ShopifyEmbeddedPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => <AppContent />;

export default App;
