import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { ClientLayout } from './ClientLayout'
import { ThemeProvider } from 'next-themes'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Backer 予約受付ページ',
  description: 'Backer 予約受付ページ',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="reservation-theme"
      enableSystem
    >
      <ClientLayout fontVariables={[notoSansJP]}>{children}</ClientLayout>
    </ThemeProvider>
  )
}
