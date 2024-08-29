import Balance from './components/Balance';
import BlockNumber from './components/BlockNumber';
import Button from './components/Button';
import ContractEvent from './components/ContractEvent';
import ContractRead from './components/ContractRead';
import ContractReads from './components/ContractReads';
import ContractWrite from './components/ContractWrite';
import EnsAddress from './components/EnsAddress';
import EnsAvatar from './components/EnsAvatar';
import EnsName from './components/EnsName';
import EnsResolver from './components/EnsResolver';
import FeeData from './components/FeeData';
import PublicClient from './components/PublicClient';
import SendTransaction from './components/SendTransaction';
import SignMessage from './components/SignMessage';
import SignTypedData from './components/SignTypedData';
import Signer from './components/Signer';
import SwitchNetwork from './components/SwitchNetwork';
import Token from './components/Token';
import Transaction from './components/Transaction';
import WaitForTransaction from './components/WaitForTransaction';
import WalletClient from './components/WalletClient';
import WatchPendingTransactions from './components/WatchPendingTransactions';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import MonoLabel from './components/MonoLabel';
import { useAccount } from 'wagmi';

const Home: NextPage = () => {
  const {address} = useAccount();
  return (
    <div className={styles.container}>
      <Head>
        <title>RainbowKit App</title>
      </Head>

      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>
          Welcome to Privy + Rainbow Kit!
        </h1>

        <p className={styles.description}>
          This demo showcases how to use the Privy Rainbow Kit connector. <br></br>
          Once you connect your wallet with Rainbow Kit, you can use Wagmi functionality to interact with the wallet. <br></br>
          SignMessage and SignTransaction will popup a page hosted by Privy where the user can approve the wallet usage. <br></br>
        </p>

        <div>
          
          {address && 
          <>
          <h2 className="mt-6 text-2xl">useAccount</h2>
          <p>
            address: <MonoLabel label={address!} />
          </p>
            <Balance />
            <SignMessage />
            <SendTransaction />
          </>
        }
        </div>
      </main>
    </div>
  );
};

export default Home;
