import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains";

import { toPrivyWallet } from "@privy-io/cross-app-connect";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        toPrivyWallet({
          id: "clxazfgyz000110geifn9qafg", // The Privy app id of provider application
          name: "Blackbird Fly", // The name of the provider application
          iconUrl:
            "https://imagedelivery.net/oHBRUd2clqykxgDWmeAyLg/313d1bc4-d395-48df-5598-31305ea2d600/icon", // The icon to appear in the connector modal
          // @ts-expect-error
          apiUrl: "https://auth.staging.privy.io",
        }),
      ],
    },
  ],
  {
    appName: "Privy",
    projectId: "Example",
  },
);

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors,
  ssr: true,
});
