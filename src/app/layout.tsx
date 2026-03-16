import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'ZS Platform',
  description: 'Agent management platform for NixOS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-gray-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}