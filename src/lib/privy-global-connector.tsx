import { createConnector } from "wagmi";
import { toPrivyWalletProvider } from "@privy-io/cross-app-connect";
import type { EIP1193Provider } from "viem";

export interface PrivyGlobalWalletOptions {
  appId: string;
  name: string;
  iconUrl?: string;
  smartWalletMode?: boolean;
}

/**
 * Creates a Privy Global Wallet connector for use with wagmi and ConnectKit
 *
 * @param options - Configuration options for the Privy wallet
 * @returns A wagmi connector configured for Privy cross-app wallets
 */
export function privyGlobalWalletConnector(options: PrivyGlobalWalletOptions) {
  return createConnector((config) => ({
    id: options.appId,
    name: options.name,
    icon: options.iconUrl,
    type: "injected", // Critical: Use 'injected' type for ConnectKit compatibility

    async setup() {
      // Setup is called when the connector is first created
      // No special setup needed for cross-app-connect
    },

    async connect({ chainId } = {}) {
      const provider = await this.getProvider();

      // Request accounts - this triggers the Privy popup
      await provider.request({ method: "eth_requestAccounts" });

      // Switch to requested chain if provided
      if (chainId) {
        try {
          await this.switchChain({ chainId });
        } catch (error) {
          console.warn("Failed to switch to requested chain:", error);
        }
      }

      const accounts = await this.getAccounts();
      const currentChainId = await this.getChainId();

      return {
        accounts,
        chainId: currentChainId,
      };
    },

    async disconnect() {
      const provider = await this.getProvider();
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        console.warn("Failed to revoke permissions:", error);
      }
    },

    async getAccounts() {
      const provider = await this.getProvider();
      const accounts = await (provider as EIP1193Provider).request({
        method: "eth_accounts",
      });
      return accounts as `0x${string}`[];
    },

    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await (provider as EIP1193Provider).request({
        method: "eth_chainId",
      });
      return Number(chainId);
    },

    async getProvider(): Promise<EIP1193Provider> {
      return toPrivyWalletProvider({
        providerAppId: options.appId,
        chains: config.chains,
        smartWalletMode: options.smartWalletMode || false,
      }) as EIP1193Provider;
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      const chain = config.chains.find((c) => c.id === chainId);

      if (!chain) {
        throw new Error(`Chain ${chainId} not configured`);
      }

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit("disconnect");
      } else {
        config.emitter.emit("change", {
          accounts: accounts as `0x${string}`[],
        });
      }
    },

    onChainChanged(chainId) {
      const id = Number(chainId);
      config.emitter.emit("change", { chainId: id });
    },

    onConnect(connectInfo) {
      config.emitter.emit("connect", {
        accounts: [],
        chainId: Number(connectInfo.chainId),
      });
    },

    onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));
}
