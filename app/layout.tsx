"use client";

import { Geist, Geist_Mono, Manrope } from "next/font/google"

import "./globals.css"
import {
  CrossmintAuthProvider,
  CrossmintProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-heading" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`antialiased font-sans ${geist.variable} ${fontMono.variable} ${manrope.variable}`}
    >
      <head>
        <title>Stablecoin Wallet Quickstart</title>
      </head>
      <body>
        <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY!}>
          <CrossmintAuthProvider loginMethods={["email", "google"]}>
            <CrossmintWalletProvider
              createOnLogin={{
                chain: "base-sepolia",
                recovery: { type: "email" },
              }}
            >
              {children}
            </CrossmintWalletProvider>
          </CrossmintAuthProvider>
        </CrossmintProvider>
      </body>
    </html>
  )
}
