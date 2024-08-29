import {
  ChainNotConfiguredError,
  Connector,
  createConnector,
  ProviderNotFoundError,
} from "@wagmi/core";
import { EIP1193Provider, getAddress, SwitchChainError } from "viem";

import { getCrossAppProviderDetails } from "./authFlow";
import { toPrivyWalletProvider } from "./provider";

export interface PrivyWalletParameters {
  connectOptions?: any;
  providerAppId: string;
  defaultNetwork?: 1;
}

// Adapted from wagmi injected connector as a reference implementation:
// https://github.com/wevm/wagmi/blob/main/packages/core/src/connectors/injected.ts#L94
export function PrivyWalletConnector(
  params: PrivyWalletParameters,
  rkDetails?: any
) {
  // Caches provider
  let _provider: EIP1193Provider | null = null;

  // Caches async getter for the provider details (url)
  let _url: string | null;
  const getProviderUrl = async () => {
    if (!_url) {
      const details = await getCrossAppProviderDetails({
        appId: params.providerAppId,
      });
      _url = details.url;
    }

    return _url;
  };

  let accountsChanged: Connector["onAccountsChanged"] | undefined;
  let chainChanged: Connector["onChainChanged"] | undefined;
  let connect: Connector["onConnect"] | undefined;
  let disconnect: Connector["onDisconnect"] | undefined;

  return createConnector<EIP1193Provider>((config) => ({
    id: "privy",
    name: "Privy Wallet",
    type: "privy",
    ...rkDetails,
    isWalletConnectModalConnector: false,

    async setup() {
      await getProviderUrl();
      const provider = await this.getProvider();

      // Only start listening for events if `target` is set, otherwise `injected()` will also receive events
      if (provider) {
        if (!connect) {
          connect = this.onConnect!.bind(this);
          provider.on("connect", connect);
        }

        // We shouldn't need to listen for `'accountsChanged'` here since the `'connect'` event should suffice (and wallet shouldn't be connected yet).
        // Some wallets, like MetaMask, do not implement the `'connect'` event and overload `'accountsChanged'` instead.
        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on("accountsChanged", accountsChanged);
        }
      }
    },

    async connect(args) {
      const provider = await this.getProvider();

      if (provider && (await this.isAuthorized())) {
        const [accounts, chainId] = await Promise.all([
          this.getAccounts(),
          this.getChainId(),
        ]);
        return { accounts, chainId };
      }

      // Early return and do NOT trigger the cross app connect flow if we are reconnecting
      if (args?.isReconnecting) {
        return { accounts: [] };
      }

      await provider.request({
        method: "eth_requestAccounts",
      });

      // Manage EIP-1193 event listeners
      // https://eips.ethereum.org/EIPS/eip-1193#events
      if (connect) {
        provider.removeListener("connect", connect);
        connect = undefined;
      }

      if (!accountsChanged) {
        accountsChanged = this.onAccountsChanged.bind(this);
        provider.on("accountsChanged", accountsChanged);
      }
      if (!chainChanged) {
        chainChanged = this.onChainChanged.bind(this);
        provider.on("chainChanged", chainChanged);
      }
      if (!disconnect) {
        disconnect = this.onDisconnect.bind(this);
        provider.on("disconnect", disconnect);
      }

      if (args?.chainId) {
        await this.switchChain!({ chainId: args.chainId });
      }

      const [accounts, chainId] = await Promise.all([
        this.getAccounts(),
        this.getChainId(),
      ]);

      return { accounts, chainId };
    },

    async disconnect() {
      const provider = await this.getProvider();

      // Manage EIP-1193 event listeners
      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = undefined;
      }
      if (!connect) {
        connect = this.onConnect!.bind(this);
        provider.on("connect", connect);
      }

      provider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });

      this.onDisconnect();
    },

    async getAccounts() {
      const provider = await this.getProvider();
      if (!provider) {
        throw new ProviderNotFoundError();
      }

      const res = await provider.request({ method: "eth_accounts" });

      return res.map((x) => getAddress(x));
    },

    async getChainId() {
      const provider = await this.getProvider();

      if (!provider) {
        throw new ProviderNotFoundError();
      }

      const res = await provider.request({ method: "eth_chainId" });

      return res;
    },

    async getProvider(): Promise<EIP1193Provider | null> {
      if (!_provider) {
        _provider = toPrivyWalletProvider({
          chains: config.chains,
          providerAppId: params.providerAppId,
          providerUrl: await getProviderUrl(),
          chainId: params.defaultNetwork,
        });
      }

      return _provider;
    },

    async isAuthorized() {
      try {
        const account = await this.getAccounts();
        return !!account.length;
      } catch (e) {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider();

      if (!provider) {
        throw new ProviderNotFoundError();
      }

      const chain = config.chains.find((chain) => chain.id === chainId);

      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError());
      }

      // Early return if the chainID is the current chainId
      if (
        chainId === Number(await provider.request({ method: "eth_chainId" }))
      ) {
        return chain;
      }

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainId.toString(16) }],
      });

      config.emitter.emit("change", { chainId });

      return chain;
    },

    async onAccountsChanged(accounts) {
      // Disconnect if there are no accounts
      if (accounts.length === 0) {
        this.onDisconnect();
        return;
      }

      // Connect if emitter is listening for connect event (e.g. is disconnected and connects through wallet interface)
      if (config.emitter.listenerCount("connect")) {
        const chainId = (await this.getChainId()).toString();
        this.onConnect?.({ chainId });
        return;
      }

      config.emitter.emit("change", {
        accounts: accounts.map((x) => getAddress(x)),
      });
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    async onConnect(connectInfo) {
      const accounts = await this.getAccounts();
      if (accounts.length === 0) return;

      const chainId = Number(connectInfo.chainId);
      config.emitter.emit("connect", { accounts, chainId });

      // Manage EIP-1193 event listeners
      const provider = await this.getProvider();
      if (provider) {
        if (connect) {
          provider.removeListener("connect", connect);
          connect = undefined;
        }
        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this);
          provider.on("accountsChanged", accountsChanged);
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this);
          provider.on("chainChanged", chainChanged);
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this);
          provider.on("disconnect", disconnect);
        }
      }
    },

    async onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));
}
