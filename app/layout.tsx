import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DLG — Desde la Grada',
  description: 'Streetwear chileno. Hecho para los que viven el juego desde las gradas.',
  keywords: ['streetwear', 'chile', 'ropa', 'moda', 'desde la grada', 'dlg'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#0e0e0e] text-white min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
