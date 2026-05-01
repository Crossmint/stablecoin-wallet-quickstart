"use client"

import { useState } from "react"
import { Copy, Check, LayoutDashboard, Code2 } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"

const SNIPPET = `// Client — read wallet state
import { useWallet } from "@crossmint/client-sdk-react-ui"

const { wallet } = useWallet()

// Check balance
const balances = await wallet.balances(["usdxm"])
const token = balances.tokens.find(t => t.symbol === "usdxm")
console.log(token?.amount) // "10.00"

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

export function WalletStep({
  address,
  email,
  balance,
  showCode = false,
}: {
  address: string
  email: string
  balance: string | null
  refreshKey?: number
  showCode?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      {showCode ? (
        <CodeSnippet code={SNIPPET} noScroll />
      ) : (
        <div className="flex items-center justify-between rounded-lg bg-[#F6F6F6] px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-black/40">Balance</span>
            <div className="text-sm font-medium text-[#00150d]">{formatBalance(balance)} USDXM</div>
          </div>
          <div className="text-right flex flex-col gap-0.5">
            <span className="text-xs text-black/40">{email}</span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-mono text-[#00150d]">{truncateAddress(address)}</span>
              <button
                onClick={copyAddress}
                className="text-black/30 hover:text-black/60 transition-colors"
                title="Copy address"
              >
                {copied ? <Check size={12} className="text-[#05B959]" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ViewToggle({
  showCode,
  onChange,
}: {
  showCode: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center border border-black/10 rounded-[6px] p-1 gap-0.5">
      <button
        onClick={() => onChange(false)}
        className={`p-1 rounded transition-colors ${!showCode ? "bg-black/[0.08]" : "hover:bg-black/[0.08]"}`}
        title="UI view"
      >
        <LayoutDashboard size={14} className="text-[#00150d]" />
      </button>
      <button
        onClick={() => onChange(true)}
        className={`p-1 rounded transition-colors ${showCode ? "bg-black/[0.08]" : "hover:bg-black/[0.08]"}`}
        title="Code view"
      >
        <Code2 size={14} className="text-[#00150d]" />
      </button>
    </div>
  )
}
