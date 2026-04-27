"use server"

import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const CHAIN = "base-sepolia"

export type SendResult = {
  hash: string
  explorerLink: string
  transactionId: string
}

// Sends USDXM using the wallet's server signer — the signing happens in-process
// on the backend with no user prompt. Requires that the server signer has
// already been authorized on the wallet (step 2).
export async function sendUsdxmFromServer({
  walletAddress,
  recipient,
  amount,
}: {
  walletAddress: string
  recipient: string
  amount: string
}): Promise<SendResult> {
  const apiKey = process.env.CROSSMINT_SERVER_SIDE_API_KEY
  const secret = process.env.CROSSMINT_SIGNER_SECRET
  if (!apiKey) throw new Error("CROSSMINT_SERVER_SIDE_API_KEY is not configured")
  if (!secret) throw new Error("CROSSMINT_SIGNER_SECRET is not configured")

  const crossmint = createCrossmint({ apiKey })
  const crossmintWallets = CrossmintWallets.from(crossmint)

  const wallet = await crossmintWallets.getWallet(walletAddress, {
    chain: CHAIN,
  })

  // Activate the server signer so subsequent operations sign with it.
  await wallet.useSigner({ type: "server", secret })

  const tx = await wallet.send(recipient, "usdxm", amount)

  return {
    hash: tx.hash,
    explorerLink: tx.explorerLink,
    transactionId: tx.transactionId,
  }
}
