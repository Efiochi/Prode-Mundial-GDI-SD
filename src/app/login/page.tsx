'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fakeEmail = `${username.toLowerCase().trim()}@prode.app`
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Email sin confirmar. Pedile al administrador que confirme tu cuenta.')
      } else if (error.message.toLowerCase().includes('invalid login') || error.message.toLowerCase().includes('invalid credentials')) {
        setError('Usuario o contraseña incorrectos')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen stadium-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="font-heading font-bold text-3xl text-[#236391] uppercase tracking-tighter">
            <span className="text-[#F6B40E]">★</span> GDI/SD Prode
          </h1>
          <p className="text-[#4A6270] text-sm mt-1 font-mono uppercase tracking-widest">USA · CAN · MEX 2026</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-heading font-bold text-xl text-[#003049] mb-6">Ingresar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="tu_usuario"
                required
                autoCapitalize="none"
                className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] placeholder-[#BBD9EE] focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#236391] hover:bg-[#1a4f73] disabled:bg-[#BBD9EE] text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all active:scale-95"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4A6270] mt-5">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-[#236391] font-semibold hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
