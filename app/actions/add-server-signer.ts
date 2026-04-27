"use server"

import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const CHAIN = "base-sepolia"

export type PreparedServerSigner = {
  locator: string
  signatureId?: string
}

// Runs entirely server-side. The signer secret never reaches the client.
// `prepareOnly: true` registers the pending signer on the wallet but returns
// the pending signatureId without auto-approving — the client then calls
// wallet.approve(...) which shows the email-recovery OTP prompt.
export async function prepareServerSigner({
  walletAddress,
}: {
  walletAddress: string
}): Promise<PreparedServerSigner> {
  const apiKey = process.env.CROSSMINT_SERVER_SIDE_API_KEY
  const secret = process.env.CROSSMINT_SIGNER_SECRET
  if (!apiKey) throw new Error("CROSSMINT_SERVER_SIDE_API_KEY is not configured")
  if (!secret) throw new Error("CROSSMINT_SIGNER_SECRET is not configured")

  const crossmint = createCrossmint({ apiKey })
  const crossmintWallets = CrossmintWallets.from(crossmint)

  const wallet = await crossmintWallets.getWallet(walletAddress, {
    chain: CHAIN,
  })

  const result = await wallet.addSigner(
    { type: "server", secret },
    { prepareOnly: true }
  )

  return {
    locator: result.locator,
    signatureId: result.signatureId,
  }
}
