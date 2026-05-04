"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui"
import type { Chain, Signer, Wallet } from "@crossmint/wallets-sdk"
import { Check, Circle } from "lucide-react"
import { ViewToggle } from "@/components/wallet-step"
import { prepareServerSigner } from "@/app/actions/add-server-signer"
import { sendUsdxmFromServer } from "@/app/actions/send-usdxm"
import { LandingPage } from "@/components/landing-page"
import { CreatingWalletScreen } from "@/components/creating-wallet-screen"
import { WalletStep } from "@/components/wallet-step"
import { AuthorizeStep } from "@/components/authorize-step"
import { TransferStep } from "@/components/transfer-step"

export default function Page() {
  const { logout, user } = useCrossmintAuth()
  const { wallet, status: walletStatus } = useWallet()

  if (!user) return <LandingPage />
  if (walletStatus === "in-progress" || walletStatus === "not-loaded") return <CreatingWalletScreen />

  return <AppContent wallet={wallet!} user={user} logout={logout} />
}

function AppContent({
  wallet,
  user,
  logout,
}: {
  wallet: Wallet<Chain>
  user: { email?: string }
  logout: () => void
}) {
  const [signers, setSigners] = useState<Signer[]>([])
  const [signersLoaded, setSignersLoaded] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [walletRefreshKey, setWalletRefreshKey] = useState(0)
  const [transferCompleted, setTransferCompleted] = useState(false)
  const [showCode1, setShowCode1] = useState(false)
  const [showCode2, setShowCode2] = useState(false)
  const [showCode3, setShowCode3] = useState(false)

  // Entrance animation — starts false, set true after first paint
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const refreshSigners = useCallback(async () => {
    try {
      const list = await wallet.signers()
      setSigners(list ?? [])
    } catch {}
    finally { setSignersLoaded(true) }
  }, [wallet])

  const refreshBalance = useCallback(async () => {
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
  const activeStep: 1 | 2 | 3 = !hasServerSigner ? 2 : 3

  const handleAuthorize = async () => {
    if (!wallet.address || !user.email) return
    setAuthorizing(true)
    setAuthError(null)
    try {
      const prepared = await prepareServerSigner({ walletAddress: wallet.address })
      if (prepared.signatureId) {
        await wallet.useSigner({ type: "email", email: user.email })
        await wallet.approve({ signatureId: prepared.signatureId })
      }
      await refreshSigners()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setAuthorizing(false)
    }
  }

  const handleDeposit = async (amount: number) => {
    await (wallet as any).stagingFund(amount)
    await refreshBalance()
    setWalletRefreshKey((k) => k + 1)
  }

  const handleTransfer = async (recipient: string) => {
    const result = await sendUsdxmFromServer({ walletAddress: wallet.address, recipient, amount: "5" })
    await refreshBalance()
    setWalletRefreshKey((k) => k + 1)
    return result
  }

  const userInitial = (user.email?.[0] ?? "U").toUpperCase()

  const slideStyle = (delay: number, opacityOverride?: number): React.CSSProperties => ({
    opacity: entered ? (opacityOverride ?? 1) : 0,
    transform: entered ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
    transitionDelay: `${delay}ms`,
  })

  return (
    <div className="min-h-dvh bg-[#F7F5F4] relative">
      {/* Top-right: avatar + logout */}
      <div className="absolute top-5 right-8 flex items-center gap-3">
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

      {/* Main layout */}
      <div className="max-w-[720px] mx-auto px-6 pt-[88px] pb-16 relative translate-x-6">

        {/* Sidebar */}
        <aside className="absolute right-full top-[88px] pr-10 w-56 pt-1 -translate-x-20" style={slideStyle(0)}>
          <h1 className="font-[family-name:var(--font-heading)] font-medium text-[26px] leading-[1.1] tracking-[-0.6px] text-[#00150d] mb-8">
            Stablecoin Wallet<br />for Agents
          </h1>
          <nav className="border-l border-[rgba(0,0,0,0.1)] flex flex-col gap-2">
            <SidebarItem active={false} completed={true} label="Create wallet" />
            <SidebarItem active={activeStep === 2} completed={activeStep > 2} label="Authorize agent" />
            <SidebarItem active={activeStep === 3} completed={transferCompleted} label="Transfer funds" />
          </nav>
        </aside>

        {/* Steps */}
        <div className="space-y-7">

          {/* Step 1 */}
          <div className="bg-white rounded-[10px] p-5" style={slideStyle(80)}>
            <div className="flex items-start justify-between mb-6">
              <StepHeader step="01" title="Create wallet" subtitle="Your wallet is created automatically when you sign in." />
              <ViewToggle showCode={showCode1} onChange={setShowCode1} />
            </div>
            <WalletStep
              address={wallet.address}
              email={user.email ?? ""}
              balance={balance}
              refreshKey={walletRefreshKey}
              showCode={showCode1}
            />
          </div>

          {/* Step 2 */}
          <div
            className={activeStep < 2 ? "pointer-events-none" : ""}
            style={slideStyle(180, activeStep < 2 ? 0.5 : 1)}
          >
            <div className="bg-white rounded-[10px] p-5">
              <div className="flex items-start justify-between mb-6">
                <StepHeader step="02" title="Authorize agent" subtitle="Give your agent permission to sign transactions on your behalf." />
                <ViewToggle showCode={showCode2} onChange={setShowCode2} />
              </div>
              <AuthorizeStep
                onAuthorize={handleAuthorize}
                authorizing={authorizing}
                error={authError}
                hasServerSigner={hasServerSigner}
                signersLoaded={signersLoaded}
                showCode={showCode2}
              />
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={activeStep < 3 ? "pointer-events-none" : ""}
            style={slideStyle(280, activeStep < 3 ? 0.5 : 1)}
          >
            <div className="bg-white rounded-[10px] p-5">
              <div className="flex items-start justify-between mb-6">
                <StepHeader step="03" title="Transfer funds" subtitle="Send 5 USDXM to any wallet address." />
                <ViewToggle showCode={showCode3} onChange={setShowCode3} />
              </div>
              <TransferStep
                onTransfer={handleTransfer}
                onDeposit={handleDeposit}
                onTransferComplete={() => setTransferCompleted(true)}
                balance={balance}
                showCode={showCode3}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function StepHeader({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 font-[family-name:var(--font-heading)] font-medium text-[20px] leading-[1.4] tracking-[-0.5px] text-[#00150d]">
        <span className="opacity-40">Step {step}</span>
        <span>{title}</span>
      </div>
      <p className="text-sm text-black/50 leading-5 mt-0.5">{subtitle}</p>
    </div>
  )
}

function SidebarItem({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-1.5 border-l-2 transition-all ${
        active ? "border-[#05B959] text-[#00150d]" : "border-transparent text-[#00150d] opacity-40"
      }`}
    >
      {completed ? (
        <div className="size-4 rounded-full bg-[#05B959] flex items-center justify-center shrink-0">
          <Check className="size-2.5 text-white stroke-[3]" />
        </div>
      ) : (
        <Circle className="size-4 shrink-0" strokeWidth={1.5} />
      )}
      <span className="font-[family-name:var(--font-heading)] font-medium text-[15px] leading-6 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}
