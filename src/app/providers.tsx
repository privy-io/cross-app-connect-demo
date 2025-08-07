"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { privyGlobalWalletConnector } from "@/lib/privy-global-connector";

const privyWalletConnector = privyGlobalWalletConnector({
  appId: "privy-wallet-app-id",
  name: "Privy wallet app name",
  iconUrl: "https://example.com/image.png",
});

const config = createConfig(
  getDefaultConfig({
    // Your dApp's chains
    chains: [mainnet],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_I!,

    // Required App Info
    appName: "Your App Name",
    connectors: [privyWalletConnector],

    // Optional App Info
    appDescription: "Your App Description",
    appUrl: "https://yourapp.com",
    appIcon: "https://yourapp.com/logo.png",
  })
);

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
