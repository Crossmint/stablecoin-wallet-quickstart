"use client"

import { Loader2 } from "lucide-react"

export function CreatingWalletScreen() {
  return (
    <div className="min-h-screen bg-[#f7f5f4] flex flex-col items-center justify-center gap-3">
      <Loader2 className="size-7 animate-spin text-[#6e6c6a]" />
      <p className="text-sm font-medium text-[#6e6c6a]">Initializing wallet...</p>
    </div>
  )
}
