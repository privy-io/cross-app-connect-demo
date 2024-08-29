import {
  Chain,
  createPublicClient,
  EIP1193EventMap,
  EIP1193Parameters,
  EIP1193Provider,
  EIP1474Methods,
  Hex,
  http,
  PublicRpcSchema,
} from "viem";

import storage from "../storage";
import sendConnectionRequestToPopup from "./authFlow";
import { sendRequestToPopup } from "./request";

type PrivyWalletProvider = EIP1193Provider;

type CrossAppConnection = {
  publicKey: string;
  privateKey: string;
  sharedSecret: string;
  address: Hex;
};

export const toPrivyWalletProvider = (opts: {
  address?: Hex;
  chainId?: number;
  chains: readonly [Chain, ...Chain[]];
  sharedSecret?: string;
  publicKey?: string;
  providerAppId: string;
  providerUrl: string;
}): PrivyWalletProvider => {
  const PROVIDER_CONNECTION_STORAGE_KEY = `privy-caw:${opts.providerAppId}:connection`;

  // Store the cross app wallet connection details specific to the provider.
  // Allows multiple provider apps to exist for the same web app.
  const existing = storage.get<CrossAppConnection>(
    PROVIDER_CONNECTION_STORAGE_KEY
  );

  let chainId = opts.chainId ?? 1;
  let publicClient = createPublicClient({
    chain: opts.chains.find((c) => Number(c.id) === chainId),
    transport: http(),
  });

  let _sharedSecret = existing?.sharedSecret;
  let _publicKey = existing?.publicKey;
  let _address = existing?.address;

  type Handlers = { [K in keyof EIP1193EventMap]: Array<EIP1193EventMap[K]> };

  const handlers: Handlers = {
    accountsChanged: [],
    connect: [],
    chainChanged: [],
    disconnect: [],
    message: [],
  };

  return {
    on: (event, listener) => {
      handlers[event].push(listener);
    },
    removeListener: (event, listener) => {
      const i = handlers[event].indexOf(listener);
      if (i > -1) {
        handlers[event].splice(i);
      }
    },
    request: (async (args) => {
      const { method, params } = args as EIP1193Parameters<EIP1474Methods>;

      console.debug("PrivyWalletProvider.request", { method, params });

      // When we explicitly request permissions or request accounts while not connected,
      // trigger the connection flow.
      if (
        method === "wallet_requestPermissions" ||
        (method === "eth_requestAccounts" && !_address)
      ) {
        const { address, sharedSecret, publicKey, privateKey } =
          await sendConnectionRequestToPopup({
            appId: opts.providerAppId,
            providerUrl: opts.providerUrl,
          });

        _address = address;
        _sharedSecret = sharedSecret;
        _publicKey = publicKey;

        storage.put<CrossAppConnection>(PROVIDER_CONNECTION_STORAGE_KEY, {
          address,
          sharedSecret,
          publicKey,
          privateKey,
        });

        handlers["accountsChanged"]?.forEach((listener) => listener([address]));
        handlers["connect"]?.forEach((listener) =>
          listener({ chainId: chainId.toString(16) })
        );
        return;
      }

      // eth_chainId must be first since it is a public action but we wanrt to handle it explicitly.
      if (method === "eth_chainId") {
        return chainId;
      }

      // Handle any other public actions with a viem public client
      if (isPublicAction(method)) {
        return publicClient.request({
          method,
          // @ts-expect-error it's impossible to type params correctly here since TS thinks
          // its the union of all possible options
          params,
        });
      }

      // The remaining RPCs will be handled explicitly, any undefined methods will throw an error.
      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          if (_address) return [_address];
          else return [];
        case "wallet_switchEthereumChain":
          chainId = Number(params[0].chainId);
          publicClient = createPublicClient({
            chain: opts.chains.find((c) => Number(c.id) === chainId),
            transport: http(),
          });

          handlers["chainChanged"].forEach((listener) =>
            listener(chainId.toString(16))
          );
          return null;
        case "wallet_revokePermissions":
          storage.del(PROVIDER_CONNECTION_STORAGE_KEY);
          return;
        case "eth_sendTransaction":
        case "eth_signTransaction":
        case "eth_signTypedData_v4":
        case "eth_sign":
        case "personal_sign":
          if (!_sharedSecret || !_publicKey) {
            throw new Error(`Must call 'eth_requestAccounts' before ${method}`);
          }

          return await sendRequestToPopup({
            request: { method, params },
            apiUrl: opts.providerUrl,
            publicKey: _publicKey,
            providerAppId: opts.providerAppId,
            sharedSecret: _sharedSecret,
          });
        default:
          throw new Error(`Unsupported request: ${method}`);
      }
      // There isn't really a clean way to get viem/typescript to play along
      // so we need this cast on the request function AND we need to cast the args
      // separately for the destructure.
    }) as EIP1193Provider["request"],
  };
};

// Allows us to filter any public actions sent to our provider as fulfill them with viem.
const PUBLIC_ACTIONS = {
  web3_clientVersion: true,
  web3_sha3: true,
  net_listening: true,
  net_peerCount: true,
  net_version: true,
  eth_blobBaseFee: true,
  eth_blockNumber: true,
  eth_call: true,
  eth_chainId: true,
  eth_coinbase: true,
  eth_estimateGas: true,
  eth_feeHistory: true,
  eth_gasPrice: true,
  eth_getBalance: true,
  eth_getBlockByHash: true,
  eth_getBlockByNumber: true,
  eth_getBlockTransactionCountByHash: true,
  eth_getBlockTransactionCountByNumber: true,
  eth_getCode: true,
  eth_getFilterChanges: true,
  eth_getFilterLogs: true,
  eth_getLogs: true,
  eth_getProof: true,
  eth_getStorageAt: true,
  eth_getTransactionByBlockHashAndIndex: true,
  eth_getTransactionByBlockNumberAndIndex: true,
  eth_getTransactionByHash: true,
  eth_getTransactionCount: true,
  eth_getTransactionReceipt: true,
  eth_getUncleByBlockHashAndIndex: true,
  eth_getUncleByBlockNumberAndIndex: true,
  eth_getUncleCountByBlockHash: true,
  eth_getUncleCountByBlockNumber: true,
  eth_maxPriorityFeePerGas: true,
  eth_newBlockFilter: true,
  eth_newFilter: true,
  eth_newPendingTransactionFilter: true,
  eth_protocolVersion: true,
  eth_sendRawTransaction: true,
  eth_uninstallFilter: true,
} as const satisfies Record<PublicRpcSchema[number]["Method"], true>;

type PublicAction = keyof typeof PUBLIC_ACTIONS;

const isPublicAction = (method: string): method is PublicAction =>
  !!PUBLIC_ACTIONS[method as PublicAction];
