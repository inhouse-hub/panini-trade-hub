// app/layout.tsx — REEMPLAZA el archivo existente

import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Manrope, JetBrains_Mono } from 'next/font/google'
import { PWARegister } from '@/components/pwa-register'
import './globals.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Panini Trade Hub — Mundial 2026',
  description: 'Gestiona tu álbum del Mundial 2026 e intercambia estampas con tus amigos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Panini',
  },
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#fbbf24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${bebas.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  )
}
