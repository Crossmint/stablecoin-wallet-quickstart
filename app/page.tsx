"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui"
import type { Signer } from "@crossmint/wallets-sdk"
import { prepareServerSigner } from "@/app/actions/add-server-signer"
import { sendUsdxmFromServer } from "@/app/actions/send-usdxm"
import { LandingPage } from "@/components/landing-page"
import { CreatingWalletScreen } from "@/components/creating-wallet-screen"
import { WalletCard } from "@/components/wallet-card"
import { AgentCard } from "@/components/agent-card"

type AppPhase =
  | "creating"
  | "wallet-shown"
  | "agent-entering"
  | "agent-initializing"
  | "agent-ready"
  | "authorized"

export default function Page() {
  const { logout, user, status: authStatus } = useCrossmintAuth()
  const { wallet, status: walletStatus } = useWallet()
  const [phase, setPhase] = useState<AppPhase>("creating")
  const [signers, setSigners] = useState<Signer[]>([])
  const [authorizing, setAuthorizing] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const sequenceStarted = useRef(false)
  // Ref so the final timeout can read the latest value without being in deps
  const hasServerSignerRef = useRef(false)

  const [balance, setBalance] = useState<string | null>(null)
  const [walletRefreshKey, setWalletRefreshKey] = useState(0)

  const refreshSigners = useCallback(async () => {
    if (!wallet) return
    try {
      const list = await wallet.signers()
      setSigners(list ?? [])
    } catch (err) {
      console.error("Failed to load signers:", err)
    }
  }, [wallet])

  const refreshBalance = useCallback(async () => {
    if (!wallet) return
    try {
      const balances = await wallet.balances(["usdxm"])
      const token = balances.tokens.find((t) => t.symbol === "usdxm")
      setBalance(token?.amount ?? "0")
    } catch {
      setBalance("0")
    }
  }, [wallet])

  useEffect(() => {
    refreshSigners()
    refreshBalance()
  }, [refreshSigners, refreshBalance])

  const hasServerSigner = signers.some((s) => s.type === "server")

  // Keep ref in sync so timeouts can read it without stale closure
  hasServerSignerRef.current = hasServerSigner

  // Always play the full animation sequence; only the final state differs
  useEffect(() => {
    if (!wallet || sequenceStarted.current) return
    sequenceStarted.current = true

    setPhase("wallet-shown")
    const t1 = setTimeout(() => setPhase("agent-entering"), 1400)
    const t2 = setTimeout(() => setPhase("agent-initializing"), 2100)
    const t3 = setTimeout(() => {
      // At sequence end, pick the right resting state
      setPhase(hasServerSignerRef.current ? "authorized" : "agent-ready")
    }, 5200)

    return () => {
      sequenceStarted.current = false
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [wallet])

  const handleDeposit = async (amount: number) => {
    if (!wallet) throw new Error("Wallet not available")
    await (wallet as any).stagingFund(amount)
    await refreshBalance()
    setWalletRefreshKey((k) => k + 1)
  }

  const handleTransfer = async (recipient: string) => {
    if (!wallet?.address) throw new Error("Wallet not available")
    await sendUsdxmFromServer({ walletAddress: wallet.address, recipient, amount: "5" })
    await refreshBalance()
  }

  const handleAuthorize = async () => {
    if (!wallet?.address || !user?.email) return
    setAuthorizing(true)
    setAuthError(null)
    try {
      const prepared = await prepareServerSigner({ walletAddress: wallet.address })
      if (prepared.signatureId) {
        await wallet.useSigner({ type: "email", email: user.email })
        await wallet.approve({ signatureId: prepared.signatureId })
      }
      await refreshSigners()
      setPhase("authorized")
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setAuthorizing(false)
    }
  }

  if (!user) return <LandingPage isLoading={false} />

  if (walletStatus === "in-progress" || walletStatus === "not-loaded") {
    return <CreatingWalletScreen />
  }

  const userInitial = (user.email?.[0] ?? "U").toUpperCase()

  return (
    <div className="min-h-screen bg-[#f7f5f4] relative">
      {/* Sidebar — absolute so cards center against full viewport */}
      <div className="absolute top-0 left-0 pl-12 pt-10">
        <h1 className="text-[28px] font-semibold tracking-tight leading-[1.2] text-[#00150d]">
          Stablecoin Wallet
          <br />
          for Agents
        </h1>
      </div>

      {/* Full-width layout */}
      <div className="flex flex-col min-h-screen">
        {/* Navbar — avatar + logout pinned to the right */}
        <div className="flex items-center justify-end px-10 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="text-xs text-black/40 hover:text-black/60 transition-colors"
            >
              Log out
            </button>
            <div className="w-9 h-9 rounded-full bg-[#eaeaea] flex items-center justify-center">
              <span className="text-[#00150d] font-medium text-[16px]">{userInitial}</span>
            </div>
          </div>
        </div>

        {/* Cards — centered in full viewport width */}
        <div className="flex flex-col items-center gap-4 px-4 pt-2 pb-16">
          {wallet && (
            <div className="w-full max-w-xl">
              <WalletCard
                address={wallet.address}
                email={user.email ?? ""}
                wallet={wallet}
                refreshKey={walletRefreshKey}
              />
            </div>
          )}

          {(phase === "agent-entering" ||
            phase === "agent-initializing" ||
            phase === "agent-ready" ||
            phase === "authorized") && (
            <AgentCard
              phase={phase}
              onAuthorize={handleAuthorize}
              authorizing={authorizing}
              error={authError}
              balance={balance}
              walletAddress={wallet?.address ?? ""}
              onDeposit={handleDeposit}
              onTransfer={handleTransfer}
            />
          )}
        </div>
      </div>
    </div>
  )
}
