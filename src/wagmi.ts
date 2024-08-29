import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

import { PrivyWallet } from "./lib/privy-wallet/wallet";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        PrivyWallet({
          providerAppId: process.env.NEXT_PUBLIC_PRIVY_PROVIDER_APP_ID ?? "", // the app id for the provider to connect to
          defaultNetwork: mainnet.id,
        }),
      ],
    },
  ],
  {
    appName: "Privy",
    projectId: "Example",
  }
);

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors,
  ssr: true,
});
