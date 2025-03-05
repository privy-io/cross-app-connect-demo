import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { monadTestnet } from "wagmi/chains";

import { toPrivyWallet } from "@privy-io/cross-app-connect/rainbow-kit";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        toPrivyWallet({
          id: "cm7vcg3i5006nks9xmobmfxlw", // The Privy app id of provider application
          name: "Monad Demo", // The name of the provider application
          iconUrl: "https://i.postimg.cc/MpWYyzD7/monad-logo-500w.png", // The icon to appear in the connector modal
        }),
      ],
    },
  ],
  {
    appName: "Privy Demo",
    projectId: "Example",
  }
);

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  connectors,
  ssr: true,
});
