import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'GoalUp',
  description: 'Оқушыларға арналған конкурстар, дедлайндар және қазақша портфолио (GoalUp AI)',
  generator: 'GoalUp Labs',
  applicationName: 'GoalUp',
  icons: {
    icon: '/images/GoalUp.jpg',
    shortcut: '/images/GoalUp.jpg',
    apple: '/images/GoalUp.jpg',
  },
  openGraph: {
    title: 'GoalUp',
    description: 'Оқушыларға арналған конкурстар, дедлайндар және қазақша портфолио (GoalUp AI)',
    images: [
      { url: '/images/GoalUp.jpg' }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoalUp',
    description: 'Оқушыларға арналған конкурстар, дедлайндар және қазақша портфолио (GoalUp AI)',
    images: ['/images/GoalUp.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/images/GoalUp.jpg" type="image/jpeg" />
        <meta name="application-name" content="GoalUp" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#facc15" />
        <meta name="theme-color" content="#facc15" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/images/GoalUp.jpg" />
      </head>
      <body>
        {children}
        <Toaster />
        {/* Register service worker for PWA */}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
