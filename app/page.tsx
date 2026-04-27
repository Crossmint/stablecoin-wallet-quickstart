"use client"

import { useCallback, useEffect, useState } from "react"
import { Code2, LogIn } from "lucide-react"
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui"
import type { Signer } from "@crossmint/wallets-sdk"
import { WalletSection } from "@/components/wallet-section"
import { ServerSignerSection } from "@/components/server-signer-section"
import { WalletBalance } from "@/components/wallet-balance"
import { SendSection } from "@/components/send-section"
import { PoweredByCrossmint } from "@/components/powered-by-crossmint"

export default function Page() {
  const { login, logout, user } = useCrossmintAuth()
  const { wallet, status } = useWallet()

  const userEmail = user?.email ?? ""

  const [showCode, setShowCode] = useState(false)

  const [signers, setSigners] = useState<Signer[]>([])
  const refreshSigners = useCallback(async () => {
    if (!wallet) return
    try {
      const list = await wallet.signers()
      setSigners(list ?? [])
    } catch (err) {
      console.error("Failed to load signers:", err)
    }
  }, [wallet])
  useEffect(() => {
    refreshSigners()
  }, [refreshSigners])
  const hasServerSigner = signers.some((s) => s.type === "server")

  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="space-y-1.5 text-center">
            <h1 className="text-lg font-semibold">
              Stablecoin Wallet Quickstart
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to create a wallet and start sending and receiving
              stablecoins.
            </p>
          </div>
          <button
            onClick={login}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <LogIn className="size-3.5" />
            Sign in
          </button>
        </div>
        <div className="flex justify-center border-t border-border py-4">
          <PoweredByCrossmint />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-8 px-6 pt-8 pb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{userEmail}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCode((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Code2 className="size-3.5" />
                {showCode ? "Hide code" : "Show code"}
              </button>
              <button
                onClick={logout}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Log out
              </button>
            </div>
          </div>

          <WalletSection
            wallet={wallet}
            loading={status === "in-progress" || status === "not-loaded"}
            showCode={showCode}
          />

          <ServerSignerSection
            wallet={wallet}
            walletAddress={wallet?.address}
            email={userEmail}
            hasServerSigner={hasServerSigner}
            showCode={showCode}
            onAdded={refreshSigners}
          />

          {wallet && (
            <>
              <section>
                <h2 className="mb-3 text-sm font-semibold">3. Balance</h2>
                <WalletBalance wallet={wallet} showCode={showCode} />
              </section>

              <SendSection
                walletAddress={wallet.address}
                canSend={hasServerSigner}
                showCode={showCode}
              />
            </>
          )}
        </div>
      </div>
      <div className="flex justify-center border-t border-border py-4">
        <PoweredByCrossmint />
      </div>
    </div>
  )
}
