'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const links = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/partidos', label: 'Partidos', icon: '⚽' },
  { href: '/mis-predicciones', label: 'Mis Picks', icon: '📋' },
  { href: '/leaderboard', label: 'Top 10', icon: '🏆' },
  { href: '/campeon', label: 'Campeón', icon: '⭐' },
  { href: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function Navbar({ user, displayName }: { user: User; displayName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = displayName || user.email?.split('@')[0] || 'Jugador'

  return (
    <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#BBD9EE] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-[#F6B40E] text-lg">★</span>
            <span className="font-heading font-bold text-xl text-[#236391] uppercase tracking-tighter">
              GDI/SD Prode
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-[#D6E9FA] text-[#236391] font-semibold'
                    : 'text-[#4A6270] hover:text-[#236391] hover:bg-[#F0F7FF]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-[#003049]">{name}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#D6E9FA] border-2 border-[#74ACDF] flex items-center justify-center shrink-0">
            <span className="text-[#236391] font-bold text-sm uppercase">{name.charAt(0)}</span>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-[#4A6270] hover:text-[#236391] transition-colors hidden md:block"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Mobile nav — scrollable row of icon+label */}
      <div className="md:hidden border-t border-[#BBD9EE] flex overflow-x-auto scrollbar-hide">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 min-w-[60px] flex flex-col items-center py-2 text-[10px] font-semibold transition-colors ${
              pathname === link.href
                ? 'text-[#236391] border-b-2 border-[#236391] bg-[#F0F7FF]'
                : 'text-[#4A6270]'
            }`}
          >
            <span className="text-base leading-none mb-0.5">{link.icon}</span>
            <span className="whitespace-nowrap">{link.label}</span>
          </Link>
        ))}
        <button
          onClick={signOut}
          className="flex-1 min-w-[60px] flex flex-col items-center py-2 text-[10px] font-semibold text-[#4A6270]"
        >
          <span className="text-base leading-none mb-0.5">🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </header>
  )
}
