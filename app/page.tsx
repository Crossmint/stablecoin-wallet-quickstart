"use client"

import { useCallback, useEffect, useState } from "react"
import { Code2 } from "lucide-react"
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui"
import type { Signer } from "@crossmint/wallets-sdk"
import { WalletSection } from "@/components/wallet-section"
import { ServerSignerSection } from "@/components/server-signer-section"
import { WalletBalance } from "@/components/wallet-balance"
import { SendSection } from "@/components/send-section"
import { LandingPage } from "@/components/landing-page"
import { Footer } from "@/components/footer"

export default function Page() {
  const { logout, user } = useCrossmintAuth()
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

  const isLoading = status === "in-progress" || status === "not-loaded"

  if (!user) {
    return <LandingPage isLoading={isLoading} />
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
      <Footer />
    </div>
  )
}
