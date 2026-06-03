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

    // Reconstruct fake email from username
    const fakeEmail = `${username.toLowerCase().trim()}@prode.app`

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (error) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold">Prode Mundial 2026</h1>
          <p className="text-gray-400 text-sm mt-1">USA · CAN · MEX</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="tu usuario"
              required
              autoCapitalize="none"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-green-400 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
