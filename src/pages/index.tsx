import Balance from "./components/Balance";
import Button from "./components/Button";
import PublicClient from "./components/PublicClient";
import SendTransaction from "./components/SendTransaction";
import SignMessage from "./components/SignMessage";
import SignTypedData from "./components/SignTypedData";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import MonoLabel from "./components/MonoLabel";
import { useAccount, useDisconnect } from "wagmi";
import Signer from "./components/Signer";

const Home: NextPage = () => {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  return (
    <div className={styles.container}>
      <Head>
        <title>Monad Demo App</title>
      </Head>

      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>Welcome to Privy + Monad!</h1>

        <p className={styles.description}>
          This demo showcases how to use the Monad Ecosystem Wallet with a
          RainbowKit connector.
          <br />
          Once you connect your wallet, you can use wagmi functionality to
          interact with the wallet. <br />
        </p>

        <div>
          {address && (
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
              <SendTransaction />

              <h2 className="mt-6 text-2xl">useDisconnect</h2>
              <Button onClick_={disconnect} cta="Disconnect from WAGMI" />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
