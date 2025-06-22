import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Neon Shopping Assistant",
  description: "Your personalized shopping companion with neon aesthetics",
    generator: 'v0.dev'
}

import { LanguageProvider } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          {/* Removed LanguageSelector as per user request */}
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
