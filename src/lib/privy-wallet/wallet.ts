import { Wallet } from "@rainbow-me/rainbowkit";

import { PrivyWalletParameters, PrivyWalletConnector } from "./connector";

export const PrivyWallet = (opts: PrivyWalletParameters) => {
  return (): Wallet => ({
    id: "privy",
    rdns: "io.privy.privy",
    name: "Privy",
    iconUrl:
      "https://pub-dc971f65d0aa41d18c1839f8ab426dcb.r2.dev/privy-dark.png",
    iconBackground: "#000000",
    installed: true,
    createConnector: (walletDetails) => {
      return PrivyWalletConnector(opts, walletDetails);
    },
  });
};
