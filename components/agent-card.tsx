"use client"

import { useEffect, useRef, useState } from "react"
import { LayoutDashboard, Code2, Shield, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"

type AgentPhase =
  | "agent-entering"
  | "agent-initializing"
  | "agent-ready"
  | "authorized"

type AgentFlow = "transfer" | null
type Operation = "transfer" | "deposit" | null

type ChatMessage = {
  id: number
  role: "user" | "agent"
  text: string
  typing?: boolean
}

const TRANSFER_AMOUNT = "5"
const DEPOSIT_AMOUNT = 10

const SNIPPET = `// Server action — signs with the server signer in-process.
"use server"
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_SIDE_API_KEY!,
})
const crossmintWallets = CrossmintWallets.from(crossmint)
const wallet = await crossmintWallets.getWallet(walletAddress, {
  chain: "base-sepolia",
})

await wallet.useSigner({
  type: "server",
  secret: process.env.CROSSMINT_SIGNER_SECRET!,
})

const tx = await wallet.send(recipient, "usdxm", amount)`

let _msgId = 0
function nextId() {
  return ++_msgId
}

function isValidEVMAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr)
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function AgentCard({
  phase,
  onAuthorize,
  authorizing,
  error,
  balance,
  walletAddress,
  onDeposit,
  onTransfer,
}: {
  phase: AgentPhase
  onAuthorize: () => Promise<void>
  authorizing: boolean
  error: string | null
  balance: string | null
  walletAddress: string
  onDeposit: (amount: number) => Promise<void>
  onTransfer: (recipient: string) => Promise<void>
}) {
  const isInitializing = phase === "agent-entering" || phase === "agent-initializing"
  const isExpanded = phase === "agent-ready" || phase === "authorized"

  const [entered, setEntered] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [activeFlow, setActiveFlow] = useState<AgentFlow>(null)
  const [operation, setOperation] = useState<Operation>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [addressError, setAddressError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [depositDone, setDepositDone] = useState(false)
  const [transferFailed, setTransferFailed] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const chatKeyRef = useRef(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const hasBalance = balance !== null && parseFloat(balance || "0") > 0
  const showChips = messages.length === 0
  const canGoBack = messages.length > 0 && !isProcessing

  function addMessage(msg: Omit<ChatMessage, "id">): number {
    const id = nextId()
    setMessages((prev) => [...prev, { ...msg, id }])
    return id
  }

  function updateMessage(id: number, updates: Partial<ChatMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const handleBack = () => {
    chatKeyRef.current++
    setMessages([])
    setActiveFlow(null)
    setOperation(null)
    setInputValue("")
    setAddressError(null)
    setDepositDone(false)
    setTransferFailed(false)
    setShowCode(false)
  }

  const handleDepositClick = async () => {
    const key = chatKeyRef.current
    setShowCode(false)
    setOperation("deposit")
    addMessage({ role: "user", text: `Do a deposit of ${DEPOSIT_AMOUNT} USDXM` })
    const agentId = addMessage({ role: "agent", text: "", typing: true })

    await delay(800)
    if (chatKeyRef.current !== key) return

    updateMessage(agentId, {
      text: `I'll deposit ${DEPOSIT_AMOUNT} USDXM to your wallet right now.`,
      typing: false,
    })

    setIsProcessing(true)
    try {
      await onDeposit(DEPOSIT_AMOUNT)
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: `Done! ${DEPOSIT_AMOUNT} USDXM have been added to your wallet.` })
      setDepositDone(true)
    } catch {
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: "Sorry, the deposit failed. Please try again." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTransferClick = () => {
    const key = chatKeyRef.current
    setShowCode(false)
    setTransferFailed(false)
    setOperation("transfer")
    addMessage({ role: "user", text: `Transfer funds to another wallet (${TRANSFER_AMOUNT} USDXM)` })
    setActiveFlow("transfer")
    setInputValue("")
    setAddressError(null)
    const agentId = addMessage({ role: "agent", text: "", typing: true })
    setTimeout(() => {
      if (chatKeyRef.current !== key) return
      updateMessage(agentId, {
        text: `Sure! Please enter the destination wallet address below.`,
        typing: false,
      })
    }, 800)
  }

  const handleAddressSubmit = async () => {
    const key = chatKeyRef.current
    const addr = inputValue.trim()
    if (!isValidEVMAddress(addr)) {
      setAddressError("Please enter a valid wallet address (0x…)")
      return
    }
    setAddressError(null)
    setActiveFlow(null)
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
      await onTransfer(addr)
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: `Done! ${TRANSFER_AMOUNT} USDXM sent to ${addr.slice(0, 6)}…${addr.slice(-4)}.` })
    } catch {
      if (chatKeyRef.current !== key) return
      addMessage({ role: "agent", text: "Sorry, the transfer failed. Please try again." })
      setTransferFailed(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Which overlay is active in the bottom section
  const showTransferInput = !showChips && operation === "transfer" && activeFlow === "transfer"
  const showDisabledInput = !showChips && operation === "transfer" && activeFlow === null && !transferFailed
  const showTryAgain = !showChips && operation === "transfer" && transferFailed
  const showDoneButton = !showChips && operation === "deposit" && depositDone

  return (
    <div
      className="w-full max-w-xl"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(100px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      <div className="bg-[#efedec] border-[8px] border-white rounded-[10px] shadow-[0_0_1px_rgba(0,0,0,0.25)]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          {/* Left: bot avatar + label, or back button */}
          <div className="relative h-9 flex items-center">
            {/* Default: bot avatar + name */}
            <div
              className="flex items-center gap-3"
              style={{
                opacity: canGoBack ? 0 : 1,
                transition: "opacity 0.2s ease",
                pointerEvents: canGoBack ? "none" : "auto",
              }}
            >
              <div className="w-9 h-9 bg-[#dddbd9] rounded-full flex items-center justify-center shrink-0">
                <BotIcon />
              </div>
              <span className="text-sm font-medium text-[#00150d]">
                {isInitializing ? <InitializingText /> : "Agent"}
              </span>
            </div>

            {/* Back: arrow replaces avatar, "Back" replaces label */}
            <button
              onClick={handleBack}
              className="absolute left-0 flex items-center gap-3 text-sm font-medium text-[#00150d] hover:opacity-70 transition-opacity"
              style={{
                opacity: canGoBack ? 1 : 0,
                transition: "opacity 0.2s ease 0.1s",
                pointerEvents: canGoBack ? "auto" : "none",
              }}
            >
              <div className="w-9 h-9 bg-[#dddbd9] rounded-full flex items-center justify-center shrink-0">
                <ArrowLeft size={16} />
              </div>
              Back
            </button>
          </div>

          {/* Right: UI/Code toggle */}
          <div
            className="flex items-center border border-black/10 rounded-[6px] p-1 gap-0.5"
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: "opacity 0.2s ease",
              pointerEvents: isExpanded ? "auto" : "none",
            }}
          >
            <button
              onClick={() => setShowCode(false)}
              className={`p-1 rounded transition-colors ${!showCode ? "bg-black/[0.08]" : "hover:bg-black/[0.08]"}`}
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

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.55s ease-in-out",
          }}
        >
          <div className="overflow-hidden">
            {showCode ? (
              /* Code view — no fixed height, grows to fit content */
              <div className="px-5 pt-4 pb-5">
                <CodeSnippet code={SNIPPET} noScroll />
              </div>
            ) : (
            <div className={`px-5 pt-4 flex flex-col gap-4 h-[356px] ${phase === "agent-ready" ? "pb-5" : "pb-1.5"}`}>

              {/* Center: flex-1 fills remaining space, pushes controls to bottom */}
              <div className="flex-1 relative min-h-0">

                {/* "What can I help with?" */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: showChips ? 1 : 0,
                    transform: showChips ? "translateY(0)" : "translateY(-8px)",
                    transition: "opacity 0.25s ease, transform 0.25s ease",
                    pointerEvents: "none",
                  }}
                >
                  <p className="text-[20px] font-semibold text-[#00150d] tracking-tight">
                    What can I help with?
                  </p>
                </div>

                {/* Chat messages */}
                <div
                  ref={messagesContainerRef}
                  className="absolute inset-0 flex flex-col gap-2 overflow-y-auto py-2"
                  style={{
                    opacity: showChips ? 0 : 1,
                    transform: showChips ? "translateY(8px)" : "translateY(0)",
                    transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
                    pointerEvents: showChips ? "none" : "auto",
                  }}
                >
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {isProcessing && operation === "deposit" && (
                    <div className="flex justify-start" style={{ animation: "fadeSlideIn 0.25s ease forwards" }}>
                      <div className="px-3 py-2 rounded-[12px] rounded-bl-[4px] bg-white">
                        <Loader2 size={16} className="animate-spin text-[#6e6c6a]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Authorize bar */}
              {phase === "agent-ready" && (
                <AuthorizeBar
                  onAuthorize={onAuthorize}
                  authorizing={authorizing}
                  error={error}
                />
              )}

              {/* Bottom controls */}
              {phase === "authorized" && (
                <div className="flex flex-col gap-2">
                  <div className="relative h-[62px]">

                    {/* Chips */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: showChips ? 1 : 0,
                        transition: "opacity 0.2s ease",
                        pointerEvents: showChips ? "auto" : "none",
                      }}
                    >
                      <div className="grid grid-cols-2 gap-4 h-full">
                        <button
                          onClick={handleDepositClick}
                          disabled={isProcessing}
                          className="text-left px-4 py-3 rounded-[8px] bg-[#E6E4E1] transition-colors text-[15px] text-black leading-5 h-full flex items-center disabled:opacity-35 disabled:cursor-not-allowed enabled:hover:bg-[#dddbd8]"
                        >
                          Do a deposit of {DEPOSIT_AMOUNT} USDXM
                        </button>
                        <button
                          onClick={handleTransferClick}
                          disabled={!hasBalance || isProcessing}
                          className="text-left px-4 py-3 rounded-[8px] bg-[#E6E4E1] transition-colors text-[15px] text-black leading-5 h-full flex items-center disabled:opacity-35 disabled:cursor-not-allowed enabled:hover:bg-[#dddbd8]"
                        >
                          Transfer funds to another wallet ({TRANSFER_AMOUNT} USDXM)
                        </button>
                      </div>
                    </div>

                    {/* Transfer: address input */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: showTransferInput ? 1 : 0,
                        transition: "opacity 0.3s ease 0.15s",
                        pointerEvents: showTransferInput ? "auto" : "none",
                      }}
                    >
                      <div className="relative h-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#E6E4E1] text-[#6e6c6a] text-xs font-medium px-2 py-0.5 rounded-[4px] pointer-events-none select-none">
                          5 USDXM
                        </div>
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddressSubmit()}
                          placeholder="0x0000...0000"
                          autoFocus={showTransferInput}
                          className="w-full h-full bg-white border border-[#e2e8f0] rounded-[8px] pl-[84px] pr-14 text-base font-mono placeholder:text-[#94a3b8] shadow-[0_0_0_4px_rgba(0,0,0,0.03)] outline-none focus:border-[#b0aead]"
                        />
                        <button
                          onClick={handleAddressSubmit}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-[10px] hover:bg-black/80 transition-colors"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Transfer: disabled input while processing/done */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: showDisabledInput ? 1 : 0,
                        transition: "opacity 0.3s ease 0.15s",
                        pointerEvents: "none",
                      }}
                    >
                      <div className="relative h-full">
                        <input
                          type="text"
                          disabled
                          placeholder="Ask me anything..."
                          className="w-full h-full bg-white border border-[#e2e8f0] rounded-[8px] px-4 pr-14 text-base placeholder:text-[#64748b] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_0_4px_rgba(0,0,0,0.03)]"
                        />
                        <button
                          disabled
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Deposit: Done button */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: showDoneButton ? 1 : 0,
                        transition: "opacity 0.35s ease 0.2s",
                        pointerEvents: showDoneButton ? "auto" : "none",
                      }}
                    >
                      <button
                        onClick={handleBack}
                        className="w-full h-full bg-[#E6E4E1] hover:bg-[#dddbd8] text-[#00150d] text-[15px] font-medium rounded-[12px] transition-colors"
                      >
                        Done
                      </button>
                    </div>

                    {/* Transfer failed: Try again button */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: showTryAgain ? 1 : 0,
                        transition: "opacity 0.35s ease 0.2s",
                        pointerEvents: showTryAgain ? "auto" : "none",
                      }}
                    >
                      <button
                        onClick={handleBack}
                        className="w-full h-full bg-[#E6E4E1] hover:bg-[#dddbd8] text-[#00150d] text-[15px] font-medium rounded-[12px] transition-colors"
                      >
                        Try again
                      </button>
                    </div>

                  </div>

                  {/* Address error */}
                  <p
                    className="text-xs text-red-500 px-1"
                    style={{
                      opacity: addressError ? 1 : 0,
                      transition: "opacity 0.15s ease",
                      minHeight: "1rem",
                    }}
                  >
                    {addressError ?? ""}
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

      </div>
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
        className={`
          max-w-[80%] px-3 py-2 rounded-[12px] text-sm leading-5
          ${isUser
            ? "bg-[#E6E4E1] text-[#00150d] rounded-br-[4px]"
            : "bg-white text-[#00150d] rounded-bl-[4px]"
          }
        `}
      >
        {message.typing ? <TypingDots /> : message.text}
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

function InitializingText() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c % 3) + 1), 450)
    return () => clearInterval(id)
  }, [])

  return (
    <span>
      Initializing agent
      <span className="inline-block w-5 text-left">{".".repeat(count)}</span>
    </span>
  )
}

function AuthorizeBar({
  onAuthorize,
  authorizing,
  error,
}: {
  onAuthorize: () => Promise<void>
  authorizing: boolean
  error: string | null
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white border border-[#dddbd9] rounded-[8px] flex items-center gap-3 px-3 py-3">
        <Shield size={16} className="text-[#6e6c6a] shrink-0" />
        <span className="flex-1 text-xs text-[#2c2c2c] leading-[18px]">
          Authorize your agent to sign on behalf this wallet
        </span>
        <button
          onClick={onAuthorize}
          disabled={authorizing}
          className="bg-[#6e6c6a] text-white text-sm font-medium px-4 py-2 rounded-[5px] hover:bg-[#5a5856] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
        >
          {authorizing && <Loader2 size={14} className="animate-spin" />}
          {authorizing ? "Authorizing..." : "Authorize"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  )
}

function BotIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="10" x="3" y="11" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" x2="8" y1="16" y2="16" />
      <line x1="16" x2="16" y1="16" y2="16" />
    </svg>
  )
}
