import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PredictionMarketProvider, MarketProvider, SoundProvider, WalletProvider, BalanceProvider } from "./contexts";
import { API_CONFIG } from "./config/api";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import MarketDetail from "./pages/MarketDetail";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import Referral from "./pages/Referral";
import ReferralRules from "./pages/ReferralRules";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import OraclePriceDemo from "./pages/OraclePriceDemo";
import Rebate from "./pages/Rebate";
import RebateRecords from "./pages/RebateRecords";
import RebateRules from "./pages/RebateRules";
import RebatePointsHistory from "./pages/RebatePointsHistory";
import RebateVolumeRecords from "./pages/RebateVolumeRecords";

const queryClient = new QueryClient();

// Prediction Market configuration from API config
const predictionMarketConfig = {
  serverUrl: API_CONFIG.zkwasmRpcUrl,
  privkey: API_CONFIG.privateKey, // This will be overridden by wallet context
};

const App = () => (
  <WalletProvider>
    <PredictionMarketProvider config={predictionMarketConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SoundProvider>
            <MarketProvider>
              <BalanceProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/market/:id" element={<MarketDetail />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/mining" element={<Rebate />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/referral" element={<Referral />} />
                    <Route path="/referral/rules" element={<ReferralRules />} />
                    <Route path="/rebate" element={<Rebate />} />
                    <Route path="/rebate/records" element={<RebateRecords />} />
                    <Route path="/rebate/rules" element={<RebateRules />} />
                    <Route path="/rebate/points-history" element={<RebatePointsHistory />} />
                    <Route path="/rebate/volume-records" element={<RebateVolumeRecords />} />
                    <Route path="/oracle-demo" element={<OraclePriceDemo />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </TooltipProvider>
              </BalanceProvider>
            </MarketProvider>
          </SoundProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PredictionMarketProvider>
  </WalletProvider>
);

export default App;
