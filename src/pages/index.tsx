import Balance from './components/Balance';
import SendTransaction from './components/SendTransaction';
import SignMessage from './components/SignMessage';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import MonoLabel from './components/MonoLabel';
import { useAccount, useDisconnect } from 'wagmi';

const Home: NextPage = () => {
  const {disconnect} = useDisconnect();
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
                <Signer />
                <SignMessage />
                <SignTypedData />
                <PublicClient />
                <EnsName />
                <EnsAddress />
                <EnsAvatar />
                <EnsResolver />
                <SwitchNetwork />
                <BlockNumber />
                <SendTransaction />
                <ContractRead />
                <ContractReads />
                <ContractWrite />
                <ContractEvent />
                <FeeData />
                <Token />
                <Transaction />
                <WatchPendingTransactions />
                <WalletClient />
                <WaitForTransaction />

                <h2 className="mt-6 text-2xl">useDisconnect</h2>
                <Button onClick_={disconnect} cta="Disconnect from WAGMI" />
          </>
        }
        </div>
      </main>
    </div>
  );
};

export default Home;
