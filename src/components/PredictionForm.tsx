'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Match, Prediction } from '@/types'

interface Props {
  match: Match
  prediction: Prediction | null
  userId: string
  isLocked: boolean
}

export default function PredictionForm({ match, prediction, userId, isLocked }: Props) {
  const router = useRouter()
  const [home, setHome] = useState(prediction?.home_score ?? 0)
  const [away, setAway] = useState(prediction?.away_score ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (isLocked) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: match.id,
      home_score: home,
      away_score: away,
    }, { onConflict: 'user_id,match_id' })

    if (error) {
      setError('Error al guardar. Intentá de nuevo.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
    setSaving(false)
  }

  if (isLocked) {
    return (
      <div className="text-center py-4">
        {prediction ? (
          <div>
            <p className="text-gray-400 text-sm mb-2">Tu predicción</p>
            <p className="text-4xl font-bold">
              {prediction.home_score} — {prediction.away_score}
            </p>
            {prediction.points !== null && (
              <p className={`mt-3 text-lg font-bold ${
                prediction.points === 3 ? 'text-green-400' :
                prediction.points === 1 ? 'text-blue-400' : 'text-red-400'
              }`}>
                {prediction.points === 3 ? '¡Resultado exacto! +3' :
                 prediction.points === 1 ? 'Ganador correcto +1' : 'Sin puntos'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No hiciste predicción para este partido.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-center text-sm text-gray-400 mb-5">
        Ingresá tu predicción de resultado
      </p>

      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">{match.home_team}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHome(h => Math.max(0, h - 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 font-bold text-lg transition-colors"
            >
              −
            </button>
            <span className="text-3xl font-bold w-10 text-center">{home}</span>
            <button
              onClick={() => setHome(h => h + 1)}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 font-bold text-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <span className="text-2xl text-gray-500 font-bold">—</span>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">{match.away_team}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAway(a => Math.max(0, a - 1))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 font-bold text-lg transition-colors"
            >
              −
            </button>
            <span className="text-3xl font-bold w-10 text-center">{away}</span>
            <button
              onClick={() => setAway(a => a + 1)}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 font-bold text-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-xl font-semibold transition-colors"
      >
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        Podés cambiar tu predicción hasta 1 hora antes del partido
      </p>
    </div>
  )
}
