import type { Metadata, Viewport } from 'next'
import { Manrope, JetBrains_Mono, Bebas_Neue } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Panini Trade Hub | World Cup 2026',
  description: 'Gestiona tu colección de estampas del Mundial 2026 e intercambia con otros coleccionistas',
  generator: 'v0.app',
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-gradient-radial">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
