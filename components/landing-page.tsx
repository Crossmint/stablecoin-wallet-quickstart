"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { EmbeddedAuthForm } from "@crossmint/client-sdk-react-ui"

const features = [
  {
    title: "Non-Custodial Wallets",
    description:
      "User-controlled wallets where Crossmint and the developer never take custody of funds. Funded by direct transfer or fiat onramp.",
    iconPath: "/shield-check.svg",
  },
  {
    title: "Delegated Signing",
    description:
      "Authorize a server-side signer once. The agent gets its own key, bound to scoped permissions the user signs off on.",
    iconPath: "/trending-up.svg",
  },
  {
    title: "Autonomous Payments",
    description:
      "Agents sign and submit stablecoin transfers with their own key — no user prompt per action. Anything outside scope is rejected.",
    iconPath: "/rocket.svg",
  },
]

export function LandingPage({ isLoading }: { isLoading: boolean }) {
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeatures(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      {/* Left side - Information with background */}
      <div
        className="relative hidden lg:flex flex-col rounded-[20px] justify-center px-18 py-8 m-3 col-span-2"
        style={{
          backgroundImage: `url('/grid-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div
          className={`absolute rounded-[20px] inset-0 bg-black/40 transition-opacity duration-600 ease-out ${
            showFeatures ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-12 text-white">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl font-bold">Stablecoin Wallet for Agents</h1>
            <p className="text-white/60 text-lg">
              Get started with the Stablecoin Wallet Quickstart.{" "}
              <a
                href="https://github.com/Crossmint/stablecoin-wallet-quickstart"
                style={{ color: "white" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Clone this repo
              </a>{" "}
              and try it out in minutes!
            </p>
          </div>

          {/* Features list */}
          <div className="flex flex-col gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex items-start gap-5 p-4 backdrop-blur-sm rounded-2xl bg-blue-300/3 border border-white/10 transition-all duration-600 ease-out ${
                  showFeatures
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: showFeatures ? `${index * 150}ms` : "0ms",
                }}
              >
                <div className="w-10 h-10 border-white/20 border-2 rounded-full flex items-center justify-center self-center flex-shrink-0">
                  <Image
                    className="filter-green w-6"
                    src={feature.iconPath}
                    alt={feature.title}
                    width={20}
                    height={20}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex flex-col items-center justify-center bg-gray-50 px-6 py-12 col-span-1 lg:col-span-3">
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stablecoin Wallet for Agents
          </h1>
          <p className="text-gray-600">
            Get started with the Stablecoin Wallet Quickstart
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full max-w-md bg-white rounded-3xl border shadow-lg overflow-hidden">
            <EmbeddedAuthForm />
          </div>
        )}
      </div>
    </div>
  )
}
