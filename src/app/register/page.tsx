'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', display_name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const username = form.username.toLowerCase().trim()
    const fakeEmail = `${username}@prode.app`
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: form.password,
      options: {
        data: {
          username,
          display_name: form.display_name.trim() || username,
        },
      },
    })
    if (error) {
      setError(error.message.includes('already registered') ? 'Ese usuario ya existe.' : error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen stadium-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="font-heading font-bold text-3xl text-[#236391] uppercase tracking-tighter">
            <span className="text-[#F6B40E]">★</span> World Cup Prode
          </h1>
          <p className="text-[#4A6270] text-sm mt-1 font-mono uppercase tracking-widest">USA · CAN · MEX 2026</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-heading font-bold text-xl text-[#003049] mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => update('username', e.target.value)}
                placeholder="ej: tano99"
                required
                pattern="[a-zA-Z0-9_]{3,20}"
                title="Letras, números y guión bajo (3-20 chars)"
                className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] placeholder-[#BBD9EE] focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1.5">
                Nombre para mostrar
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => update('display_name', e.target.value)}
                placeholder="ej: El Tano"
                className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] placeholder-[#BBD9EE] focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                minLength={6}
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
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4A6270] mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-[#236391] font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
