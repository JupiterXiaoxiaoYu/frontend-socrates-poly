import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setRpcUrl } from "zkwasm-minirollup-browser";
import { PrivyProvider } from "@privy-io/react-auth";
import { Analytics } from "@vercel/analytics/react";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import ThemeProvider from "./components/theme-provider";
import "./index.css";

// Configure zkWasm RPC URL
setRpcUrl(); // Will use VITE_ZKWASM_RPC_URL from .env or default

// Privy Configuration
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || "";

// Register Service Worker for PWA
registerSW({
  immediate: true
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          logo: "/placeholder.svg",
        },
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <ThemeProvider>
        <App />
        <Analytics />
      </ThemeProvider>
    </PrivyProvider>
  </StrictMode>
);
