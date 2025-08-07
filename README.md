# Cross-App Connect Demo

This is an example app showcasing ConnectKit + Privy wallets.

This is a demo NextJS app that showcases how requester applications can use ConnectKit to connect to Privy wallets created by provider applications. Requester apps do not need to be using Privy to access the cross app wallets, they can simply use the ConnectKit connector as provided in the @privy-io/cross-app-connect package.

Check out our [cross app connect docs](https://docs.privy.io/wallets/global-wallets/integrate-a-global-wallet/connectkit-connector) for more guidance!

## Key Files to Check Out

- [`src/lib/privy-global-connector.tsx`](src/lib/privy-global-connector.tsx) - Custom wagmi connector to enable Privy wallets with ConnectKit
- [`src/app/providers.tsx`](src/app/providers.tsx) - Provider setup

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
