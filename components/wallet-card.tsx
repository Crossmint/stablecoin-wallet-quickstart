"use client"

import { useCallback, useEffect, useState } from "react"
import { LayoutDashboard, Code2 } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"
import type { Chain, Wallet } from "@crossmint/wallets-sdk"

const SNIPPET = `// Client component — read wallet state
import { useWallet } from "@crossmint/client-sdk-react-ui"

const { wallet } = useWallet()

// Check balance
const balances = await wallet.balances(["usdxm"])
const token = balances.tokens.find(t => t.symbol === "usdxm")

// Fund wallet (staging only)
await wallet.stagingFund(10)

// List signers
const signers = await wallet.signers()`

function truncateAddress(addr: string) {
  if (addr.length <= 13) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatBalance(raw: string | null) {
  if (raw === null) return "—"
  const n = parseFloat(raw)
  return isNaN(n) ? "0.00" : n.toFixed(2)
}

export function WalletCard({
  address,
  email,
  wallet,
  refreshKey = 0,
}: {
  address: string
  email: string
  wallet: Wallet<Chain>
  refreshKey?: number
}) {
  const [balance, setBalance] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const fetchBalance = useCallback(async () => {
    try {
      const balances = await wallet.balances(["usdxm"])
      const token = balances.tokens.find((t) => t.symbol === "usdxm")
      setBalance(token?.amount ?? "0")
    } catch {
      setBalance("0")
    }
  }, [wallet])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance, refreshKey])

  return (
    <div
      className="w-full bg-white rounded-[10px] p-5 flex flex-col gap-7"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(100px)",
        transition: "opacity 0.55s ease-out, transform 0.55s ease-out",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-semibold text-[#00150d] tracking-tight">Wallet</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-black/80">{email}</span>
            <span className="w-[5px] h-[5px] rounded-full bg-black/40 shrink-0" />
            <span className="text-sm text-black/80 font-mono">{truncateAddress(address)}</span>
          </div>
        </div>
        <div className="flex items-center border border-black/10 rounded-[6px] p-1 gap-0.5">
          <button
            onClick={() => setShowCode(false)}
            className={`p-1 rounded transition-colors ${!showCode ? "bg-black/[0.08]" : "hover:bg-black/[0.14]"}`}
            title="UI view"
          >
            <LayoutDashboard size={14} className="text-[#6e6c6a]" />
          </button>
          <button
            onClick={() => setShowCode(true)}
            className={`p-1 rounded transition-colors ${showCode ? "bg-black/[0.08]" : "hover:bg-black/[0.08]"}`}
            title="Code view"
          >
            <Code2 size={14} className="text-[#6e6c6a]" />
          </button>
        </div>
      </div>

      {showCode ? (
        <CodeSnippet code={SNIPPET} noScroll />
      ) : (
        <div className="bg-[#f6f6f6] rounded-[10px] px-[14px] py-[10px] flex items-center gap-3">
          {/* Green wallet icon */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <div className="flex flex-col gap-[5px]">
            <span className="text-sm font-medium text-[#020617] whitespace-pre">
              {`Balance  ${formatBalance(balance)}`}
            </span>
            <span className="text-[13px] text-black/50">USDXM</span>
          </div>
        </div>
      )}
    </div>
  )
}
