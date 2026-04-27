"use client"

import { useState } from "react"
import { Check, Loader2, Server } from "lucide-react"
import type { Chain, Wallet } from "@crossmint/wallets-sdk"
import { CodeSnippet } from "@/components/code-snippet"
import { prepareServerSigner } from "@/app/actions/add-server-signer"

const SNIPPET = `// 1. Server action: register the server signer in prepare-only mode.
//    The secret stays server-side; we get back a pending signatureId.
"use server"
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_SIDE_API_KEY!,
})
const crossmintWallets = CrossmintWallets.from(crossmint)
const serverWallet = await crossmintWallets.getWallet(walletAddress, {
  chain: "base-sepolia",
})
const { locator, signatureId } = await serverWallet.addSigner(
  { type: "server", secret: process.env.CROSSMINT_SIGNER_SECRET! },
  { prepareOnly: true },
)

// 2. Client: switch to the email recovery signer (triggers OTP prompt),
//    then approve the pending operation.
const { wallet } = useWallet()
await wallet.useSigner({ type: "email", email: userEmail })
await wallet.approve({ signatureId })`

export function ServerSignerSection({
  wallet,
  walletAddress,
  email,
  hasServerSigner,
  showCode,
  onAdded,
}: {
  wallet: Wallet<Chain> | undefined
  walletAddress: string | undefined
  email: string
  hasServerSigner: boolean
  showCode: boolean
  onAdded?: () => void | Promise<void>
}) {
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!wallet || !walletAddress) return
    setLoading(true)
    setError(null)
    try {
      const prepared = await prepareServerSigner({ walletAddress })
      if (prepared.signatureId) {
        // Switch the wallet's active signer to the email recovery signer so
        // the SDK can prompt the user for the OTP and then approve.
        await wallet.useSigner({ type: "email", email })
        await wallet.approve({ signatureId: prepared.signatureId })
      }
      setAdded(true)
      await onAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const showAddedState = added || hasServerSigner

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">2. Authorize your agent</h2>
      {showAddedState ? (
        <div className="rounded-lg border border-border bg-muted">
          <div className="flex items-center gap-3 px-4 py-3">
            <Check className="size-4 text-primary" />
            <div className="min-w-0">
              <div className="text-sm font-medium">Agent authorized</div>
              <div className="text-xs text-muted-foreground">
                Your agent now can sign transactions on behalf of you.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            {walletAddress
              ? "Authorize your agent to sign on behalf of this wallet. The signer secret stays on your backend; approve the registration via email OTP."
              : "Create a wallet first to authorize your agent."}
          </p>
          <button
            onClick={handleAdd}
            disabled={!walletAddress || loading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                <Server className="size-3.5" />
                Authorize your agent
              </>
            )}
          </button>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>
      )}
      {showCode && <CodeSnippet code={SNIPPET} />}
    </section>
  )
}
