"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"

const SNIPPET = `// Server action — signs with the server signer in-process
"use server"
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_SIDE_API_KEY!,
})
const wallets = CrossmintWallets.from(crossmint)
const wallet = await wallets.getWallet(walletAddress, {
  chain: "base-sepolia",
})

await wallet.useSigner({
  type: "server",
  secret: process.env.CROSSMINT_SIGNER_SECRET!,
})

const tx = await wallet.send(recipient, "usdxm", amount)`

const TRANSFER_AMOUNT = "5"

type ChatMessage = { id: number; role: "user" | "agent"; text: string; typing?: boolean; explorerLink?: string }

let _msgId = 0
function nextId() { return ++_msgId }

function isValidEVMAddress(addr: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const DEPOSIT_AMOUNT = 10

export function TransferStep({
  onTransfer,
  onDeposit,
  onTransferComplete,
  balance,
  showCode = false,
}: {
  onTransfer: (recipient: string) => Promise<{ explorerLink: string }>
  onDeposit: (amount: number) => Promise<void>
  onTransferComplete?: () => void
  balance: string | null
  showCode?: boolean
}) {
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [addressError, setAddressError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [depositing, setDepositing] = useState(false)
  const [awaitingAddress, setAwaitingAddress] = useState(false)
  const [transferFailed, setTransferFailed] = useState(false)
  const [transferDone, setTransferDone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatKeyRef = useRef(0)

  const hasBalance = balance !== null && parseFloat(balance || "0") > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages, isProcessing])

  function addMessage(msg: Omit<ChatMessage, "id">): number {
    const id = nextId()
    setMessages((prev) => [...prev, { ...msg, id }])
    return id
  }

  function updateMessage(id: number, updates: Partial<ChatMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const handleReset = () => {
    chatKeyRef.current++
    setStarted(false)
    setMessages([])
    setInputValue("")
    setAddressError(null)
    setIsProcessing(false)
    setAwaitingAddress(false)
    setTransferFailed(false)
    setTransferDone(false)
  }

  const handleDeposit = async () => {
    setDepositing(true)
    try {
      await onDeposit(DEPOSIT_AMOUNT)
    } finally {
      setDepositing(false)
    }
  }

  const handleStart = async () => {
    const key = chatKeyRef.current
    setStarted(true)
    addMessage({ role: "user", text: `Transfer ${TRANSFER_AMOUNT} USDXM to another wallet` })
    const agentId = addMessage({ role: "agent", text: "", typing: true })

    await delay(800)
    if (chatKeyRef.current !== key) return

    updateMessage(agentId, {
      text: "Sure! Please enter the destination wallet address below.",
      typing: false,
    })
    setAwaitingAddress(true)
  }

  const handleAddressSubmit = async () => {
    const key = chatKeyRef.current
    const addr = inputValue.trim()
    if (!isValidEVMAddress(addr)) {
      setAddressError("Please enter a valid wallet address (0x…)")
      return
    }
    setAddressError(null)
    setAwaitingAddress(false)
    addMessage({ role: "user", text: addr })
    setInputValue("")

    const agentId = addMessage({ role: "agent", text: "", typing: true })
    await delay(800)
    if (chatKeyRef.current !== key) return

    updateMessage(agentId, {
      text: `Transferring ${TRANSFER_AMOUNT} USDXM to ${addr.slice(0, 6)}…${addr.slice(-4)}…`,
      typing: false,
    })

    setIsProcessing(true)
    try {
      const { explorerLink } = await onTransfer(addr)
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: `Done! ${TRANSFER_AMOUNT} USDXM sent to ${addr.slice(0, 6)}…${addr.slice(-4)}.`, explorerLink })
      setTransferDone(true)
      onTransferComplete?.()
    } catch {
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: "Sorry, the transfer failed. Please try again." })
      setTransferFailed(true)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      {/* Reset link — only visible once chat has started */}
      <div className="flex justify-start mb-3" style={{ minHeight: "1rem" }}>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-black/40 hover:text-black/70 transition-colors"
          style={{ opacity: started ? 1 : 0, pointerEvents: started ? "auto" : "none" }}
        >
          <ArrowLeft size={12} />
          Reset
        </button>
      </div>

      {showCode ? (
        <CodeSnippet code={SNIPPET} noScroll />
      ) : !started ? (
        /* Initial state: two action chips */
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDeposit}
            disabled={depositing}
            className="w-full px-4 py-3 rounded-lg bg-[#F6F6F6] hover:bg-[#eeedeb] transition-colors text-sm text-[#00150d] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {depositing && <Loader2 size={14} className="animate-spin shrink-0" />}
              {depositing ? `Depositing ${DEPOSIT_AMOUNT} USDXM…` : `Deposit ${DEPOSIT_AMOUNT} USDXM`}
            </span>
            {!depositing && <ArrowRight size={14} className="text-black/30 shrink-0" />}
          </button>
          <button
            onClick={handleStart}
            disabled={!hasBalance || depositing}
            className="w-full px-4 py-3 rounded-lg bg-[#F6F6F6] hover:bg-[#eeedeb] transition-colors text-sm text-[#00150d] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span>Transfer {TRANSFER_AMOUNT} USDXM to another wallet</span>
            <ArrowRight size={14} className="text-black/30 shrink-0" />
          </button>
        </div>
      ) : (
        /* Chat state */
        <div className="flex flex-col gap-3">
          {/* Message bubbles */}
          <div className="flex flex-col gap-2 min-h-[80px]">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isProcessing && (
              <div className="flex justify-start" style={{ animation: "fadeSlideIn 0.25s ease forwards" }}>
                <div className="px-3 py-2 rounded-[12px] rounded-bl-[4px] bg-[#F6F6F6]">
                  <Loader2 size={14} className="animate-spin text-[#6e6c6a]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom control */}
          {awaitingAddress && (
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#E6E4E1] text-[#6e6c6a] text-xs font-medium px-2 py-0.5 rounded-[4px] pointer-events-none select-none">
                  {TRANSFER_AMOUNT} USDXM
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddressSubmit()}
                  placeholder="0x0000...0000"
                  autoFocus
                  className="w-full h-[52px] bg-white border border-[rgba(0,0,0,0.1)] rounded-lg pl-[84px] pr-14 text-sm font-mono placeholder:text-[#94a3b8] outline-none focus:border-[#05B959] focus:ring-2 focus:ring-[#05B959]/10"
                />
                <button
                  onClick={handleAddressSubmit}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#05B959] text-white p-2 rounded-[8px] hover:bg-[#049d4c] transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              {addressError && <p className="text-xs text-red-500 px-1">{addressError}</p>}
            </div>
          )}

          {transferDone && (
            <button
              onClick={handleReset}
              className="w-full py-3 bg-[#F5FCF8] border border-[#DDF5E8] text-[#05B959] text-sm font-medium rounded-lg hover:bg-[#edf9f1] transition-colors"
            >
              Done
            </button>
          )}

          {transferFailed && (
            <button
              onClick={handleReset}
              className="w-full py-3 bg-[#F6F6F6] hover:bg-[#eeedeb] text-[#00150d] text-sm font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animation: "fadeSlideIn 0.25s ease forwards" }}
    >
      <div
        className={`max-w-[80%] px-3 py-2 rounded-[12px] text-sm leading-5 ${
          isUser
            ? "bg-[#E6E4E1] text-[#00150d] rounded-br-[4px]"
            : "bg-[#F6F6F6] text-[#00150d] rounded-bl-[4px]"
        }`}
      >
        {message.typing ? (
          <TypingDots />
        ) : (
          <>
            {message.text}
            {message.explorerLink && (
              <a
                href={message.explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-xs text-black/40 hover:text-black/70 underline underline-offset-2 transition-colors"
              >
                View on explorer →
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#6e6c6a] animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#6e6c6a] animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#6e6c6a] animate-bounce" />
    </div>
  )
}
