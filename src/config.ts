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
          providerAppId: "cm0csdzar0004elj3espeb2mz", // the app id for the provider to connect to TODO change to rainbow fields?
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
