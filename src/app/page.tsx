"use client";
import { ConnectKitButton } from "connectkit";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold text-center">
        Welcome to Privy + ConnectKit!
      </h1>
      <ConnectKitButton />
    </div>
  );
}
