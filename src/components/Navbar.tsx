'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Partidos', icon: '⚽' },
    { href: '/leaderboard', label: 'Top 10', icon: '🏆' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center h-14 gap-4">
        <span className="font-bold text-green-400 mr-2 hidden sm:block">Mundial 2026</span>
        <div className="flex gap-1 flex-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        <button
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Salir
        </button>
      </div>
    </nav>
  )
}
