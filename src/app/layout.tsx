import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Predicciones para el Mundial FIFA 2026 — USA/CAN/MEX',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
