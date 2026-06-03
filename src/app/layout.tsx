import type { Metadata } from 'next'
import { Archivo_Narrow, Inter } from 'next/font/google'
import './globals.css'

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Predicciones para el Mundial FIFA 2026 — USA/CAN/MEX',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivoNarrow.variable} ${inter.variable}`}>
      <body className="antialiased stadium-bg">
        {children}
      </body>
    </html>
  )
}
