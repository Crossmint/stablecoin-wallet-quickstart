# Stablecoin Wallet Quickstart

A Next.js example that walks through creating a wallet, authorizing a server-side signer, funding it, and sending stablecoin (USDXM) transfers — using the [Crossmint Wallets SDK](https://docs.crossmint.com/wallets/overview) on Base Sepolia.

The flow demonstrates a common pattern for agent-driven payments: the user authorizes a backend signer once (with email-OTP approval), and from then on the backend can sign transfers without further user prompts.

## What it demonstrates

1. **Wallet creation on login.** `<CrossmintWalletProvider>` auto-creates a Base Sepolia wallet for the authenticated user, with email recovery.
2. **Authorizing a server signer.** A server action registers the signer in `prepareOnly` mode. The client switches to the email recovery signer and approves the pending registration via OTP. The signer secret never leaves the server.
3. **Funding and reading balances.** Staging-only `wallet.stagingFund(amount)` mints USDXM into the wallet for testing.
4. **Sending stablecoin.** A server action signs the transfer with the server signer — no user prompt at send time.

## Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io/)
- A [Crossmint staging](https://staging.crossmint.com/) project

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` — client-side key from the [Crossmint console](https://staging.crossmint.com/console/projects/apiKeys)
- `CROSSMINT_SERVER_SIDE_API_KEY` — server-side key with the `wallets.create` scope
- `CROSSMINT_SIGNER_SECRET` — 64-char hex string (or `xmsk1_<64-hex>`); used by the server signer, stays on the server

## Run

```bash
pnpm dev
```

Open <http://localhost:3000> and sign in with email or Google. Toggle **Show code** in the header to see the SDK calls behind each step.

## Project layout

- `app/layout.tsx` — Crossmint providers and chain config
- `app/page.tsx` — top-level UI orchestrating the four steps
- `app/actions/` — server actions: `add-server-signer.ts`, `send-usdxm.ts`
- `components/` — section components for wallet, signer authorization, balance, and send
