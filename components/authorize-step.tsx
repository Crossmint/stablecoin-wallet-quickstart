"use client"

import { Shield, Check, Loader2 } from "lucide-react"
import { CodeSnippet } from "@/components/code-snippet"

const SNIPPET = `// Server action — add a server signer and approve
"use server"
import { createCrossmint, CrossmintWallets } from "@crossmint/wallets-sdk"

const crossmint = createCrossmint({
  apiKey: process.env.CROSSMINT_SERVER_SIDE_API_KEY!,
})
const wallets = CrossmintWallets.from(crossmint)
const wallet = await wallets.getWallet(walletAddress, {
  chain: "base-sepolia",
})

// Register server as a signer and approve the request
await wallet.useSigner({
  type: "server",
  secret: process.env.CROSSMINT_SIGNER_SECRET!,
})
await wallet.approve({ signatureId })`

export function AuthorizeStep({
  onAuthorize,
  authorizing,
  error,
  hasServerSigner,
  signersLoaded = false,
  showCode = false,
}: {
  onAuthorize: () => Promise<void>
  authorizing: boolean
  error: string | null
  hasServerSigner: boolean
  signersLoaded?: boolean
  showCode?: boolean
}) {
  return (
    <div>
      {showCode ? (
        <CodeSnippet code={SNIPPET} noScroll />
      ) : !signersLoaded ? (
        /* Skeleton — same height as the real content to avoid layout shift */
        <div className="h-[52px] rounded-lg bg-[#F6F6F6] animate-pulse" />
      ) : hasServerSigner ? (
        <div className="flex items-center gap-3 rounded-lg bg-[#F5FCF8] border border-[#DDF5E8] px-4 py-3">
          <div className="size-7 rounded-full bg-[#05B959] flex items-center justify-center shrink-0">
            <Check className="size-4 text-white stroke-[2.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#00150d]">Agent authorized</p>
            <p className="text-xs text-black/50 mt-0.5">Your agent can now sign transactions on your behalf.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-lg bg-[#F6F6F6] px-4 py-3">
            <Shield size={16} className="text-[#6e6c6a] shrink-0" />
            <span className="flex-1 text-sm text-[#2c2c2c] leading-5">
              Authorize your agent to sign on behalf of this wallet
            </span>
            <button
              onClick={onAuthorize}
              disabled={authorizing}
              className="bg-[#05B959] text-white text-sm font-medium px-4 py-2 rounded-[6px] hover:bg-[#049d4c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
            >
              {authorizing && <Loader2 size={14} className="animate-spin" />}
              {authorizing ? "Authorizing…" : "Authorize"}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
