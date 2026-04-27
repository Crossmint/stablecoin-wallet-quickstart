"use client"

import { useState } from "react"
import { Check, ChevronRight, ExternalLink, Loader2, Send } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"
import { sendUsdxmFromServer, type SendResult } from "@/app/actions/send-usdxm"

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

export function SendSection({
  walletAddress,
  canSend,
  showCode,
}: {
  walletAddress: string | undefined
  canSend: boolean
  showCode: boolean
}) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setResult(null)
    setError(null)
  }

  const handleSend = async () => {
    if (!walletAddress) return
    setLoading(true)
    setError(null)
    try {
      const tx = await sendUsdxmFromServer({ walletAddress, recipient, amount })
      setResult(tx)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const body = result ? (
    <div className="rounded-lg border border-border bg-muted">
      <div className="flex items-center gap-3 px-4 py-3">
        <Check className="size-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Transaction sent</div>
          <div className="font-mono text-xs break-all text-muted-foreground">
            {result.hash ?? result.transactionId ?? ""}
          </div>
        </div>
        {result.explorerLink && (
          <a
            href={result.explorerLink}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
            aria-label="View on explorer"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
          View transaction response
        </summary>
        <pre className="overflow-x-auto border-t border-border bg-background px-4 py-3 font-mono text-xs">
          <code>{JSON.stringify(result, null, 2)}</code>
        </pre>
      </details>
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Send another
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x0000000000000000000000000000000000000000"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-md border border-border bg-background py-1.5 pr-14 pl-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
            USDXM
          </span>
        </div>
        <button
          onClick={handleSend}
          disabled={
            !canSend ||
            !walletAddress ||
            !recipient ||
            !amount ||
            Number(amount) <= 0 ||
            loading
          }
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              Send
            </>
          )}
        </button>
      </div>
      {!canSend && (
        <p className="text-xs text-muted-foreground">
          Authorize your agent (step 2) to enable server-signed transfers.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">
        4. Send funds with your agent
      </h2>
      {body}
      {showCode && <CodeSnippet code={SNIPPET} />}
    </section>
  )
}
