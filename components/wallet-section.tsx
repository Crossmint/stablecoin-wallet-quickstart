"use client"

import { Loader2, Wallet as WalletIcon } from "lucide-react"
import type { Chain, Wallet } from "@crossmint/wallets-sdk"
import { CodeSnippet } from "@/components/code-snippet"

const SNIPPET = `// Configured once on the provider:
<CrossmintWalletProvider
  createOnLogin={{
    chain: "base-sepolia",
    recovery: { type: "email" },
  }}
>

// Then in any component:
const { wallet } = useWallet()`

export function WalletSection({
  wallet,
  loading,
  showCode,
}: {
  wallet: Wallet<Chain> | undefined
  loading: boolean
  showCode: boolean
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold mb-3">1. Your wallet</h2>
      {!wallet ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {loading ? "Creating your wallet..." : "Loading wallet..."}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted">
          <div className="flex items-center gap-3 px-4 py-3">
            <WalletIcon className="size-4 text-primary" />
            <div className="min-w-0">
              <div className="text-sm font-medium">Wallet created on login</div>
              <div className="font-mono text-xs text-muted-foreground break-all">
                {wallet.address}
              </div>
            </div>
          </div>
        </div>
      )}
      {showCode && <CodeSnippet code={SNIPPET} />}
    </section>
  )
}
