import type { Metadata } from "next"
import ClientRoot from "@/app/client"
import "./globals.css"

export const metadata: Metadata = {
  title: "Clean Pay",
  description: "Clean Pay7",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
