import type { Metadata } from 'next';
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Sidebar } from '@/components/common';
import { serverConvexAuth } from '@/lib/auth/auth-server';
import '../../globals.css';
import { ThemeProvider } from 'next-themes'
export const metadata: Metadata = {
  title: 'Bcker - ダッシュボード',
  description: 'Bckerはサロンの予約管理を便利にするサービスです。',
  icons: {
    icon: '/convex.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId, token } = await serverConvexAuth()

  const preloadedSalon = await preloadQuery(
    api.salon.core.query.findByClerkId,
    { clerkId: userId },
    { token: token }
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="dashboard-theme"
      enableSystem
    >
      <Sidebar preloadedSalon={preloadedSalon}>{children}</Sidebar>
    </ThemeProvider>
  )
}
