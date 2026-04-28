

<div align="center">
<img width="200" alt="Image" src="https://github.com/user-attachments/assets/8b617791-cd37-4a5a-8695-a7c9018b7c70" />
<br>
<br>
<h1>Stablecoin Wallet Quickstart</h1>

<div align="center">
<a href="https://stablecoin-wallet.demos-crossmint.com">Live Demo</a> | <a href="https://docs.crossmint.com/agents/overview">Docs</a> | <a href="https://www.crossmint.com/quickstarts">See all quickstarts</a>
</div>

<br>
<br>
</div>

## Introduction
Create a wallet, authorize a server-side signer, and send stablecoin transfers using the [Crossmint Wallets SDK](https://docs.crossmint.com/wallets/overview) on Base Sepolia. This quickstart demonstrates a common pattern for agent-driven payments: the user or AI agent authorizes a backend signer once, and from then on the backend can sign transfers without further prompts.

**Learn how to:**
- Create a wallet on login with email recovery
- Authorize a server-side signer with email-OTP approval
- Fund a wallet with USDXM (test stablecoin)
- Send stablecoin transfers signed by the server signer

## Deploy
Easily deploy the template to Vercel with the button below. You will need to set the required environment variables in the Vercel dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCrossmint%2Fstablecoin-wallet-quickstart&env=NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY,CROSSMINT_SERVER_SIDE_API_KEY,CROSSMINT_SIGNER_SECRET)

## Setup
1. Clone the repository and navigate to the project folder:
```bash
git clone https://github.com/Crossmint/stablecoin-wallet-quickstart.git && cd stablecoin-wallet-quickstart
```

2. Install all dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up the environment variables:
```bash
cp .env.example .env.local
```

4. Get your API keys from the [Crossmint staging console](https://staging.crossmint.com/console/projects/apiKeys) and add them to the `.env.local` file. The server-side key needs the `wallets.create` scope.
```bash
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=your_crossmint_client_api_key
CROSSMINT_SERVER_SIDE_API_KEY=your_crossmint_server_api_key
CROSSMINT_SIGNER_SECRET=your_64_char_hex_string
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Using in production
1. Create a [production API key](https://docs.crossmint.com/introduction/platform/api-keys/client-side).
