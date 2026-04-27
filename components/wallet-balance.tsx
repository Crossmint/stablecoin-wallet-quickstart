"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import type { Chain, Wallet } from "@crossmint/wallets-sdk"
import { CodeSnippet } from "@/components/code-snippet"

const FUND_AMOUNT = 5

const SNIPPET = `const { wallet } = useWallet()

// Staging-only: mints USDXM directly into the wallet for testing.
await wallet.stagingFund(${FUND_AMOUNT})

// Read the balance back. Pass token symbols you care about beyond the defaults.
const balances = await wallet.balances(["usdxm"])
const usdxm = balances.tokens.find((t) => t.symbol === "usdxm")`

export function WalletBalance({
  wallet,
  showCode,
}: {
  wallet: Wallet<Chain>
  showCode: boolean
}) {
  const [usdxm, setUsdxm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [funding, setFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const balances = await wallet.balances(["usdxm"])
      const token = balances.tokens.find((t) => t.symbol === "usdxm")
      setUsdxm(token?.amount ?? "0")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance")
    } finally {
      setLoading(false)
    }
  }, [wallet])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleFund = async () => {
    setFunding(true)
    setError(null)
    try {
      await wallet.stagingFund(FUND_AMOUNT)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setFunding(false)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Balance
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Refresh balance"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-semibold tabular-nums">
              {usdxm ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">USDXM</div>
          </div>
          <button
            onClick={handleFund}
            disabled={funding}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {funding ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Funding...
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Fund {FUND_AMOUNT} USDXM
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
      {showCode && <CodeSnippet code={SNIPPET} />}
    </>
  )
}
