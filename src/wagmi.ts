import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

import { toPrivyWallet } from "@privy-io/cross-app-connect";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        toPrivyWallet({
          id: "clxazfgyz000110geifn9qafg", // the app id for the provider to connect to
          name: "Blackbird Fly",
          iconUrl:
            "https://imagedelivery.net/oHBRUd2clqykxgDWmeAyLg/313d1bc4-d395-48df-5598-31305ea2d600/icon", // TODO: change
          apiUrl: "https://auth.staging.privy.io",
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
