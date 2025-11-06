import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PredictionMarketProvider, MarketProvider, SoundProvider, WalletProvider } from "./contexts";
import { API_CONFIG } from "./config/api";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import MarketDetail from "./pages/MarketDetail";
import Portfolio from "./pages/Portfolio";
import Rewards from "./pages/Rewards";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import OraclePriceDemo from "./pages/OraclePriceDemo";
import TradingViewDemo from "./pages/TradingViewDemo";

const queryClient = new QueryClient();

// Prediction Market configuration from API config
const predictionMarketConfig = {
  serverUrl: API_CONFIG.serverUrl,
  privkey: API_CONFIG.privateKey, // This will be overridden by wallet context
};

const App = () => (
  <WalletProvider>
    <PredictionMarketProvider config={predictionMarketConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SoundProvider>
            <MarketProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/market/:id" element={<MarketDetail />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/rewards" element={<Rewards />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/oracle-demo" element={<OraclePriceDemo />} />
                    <Route path="/trading-view" element={<TradingViewDemo />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </TooltipProvider>
            </MarketProvider>
          </SoundProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PredictionMarketProvider>
  </WalletProvider>
);

export default App;
