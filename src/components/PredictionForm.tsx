'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Match, Prediction } from '@/types'
import { getFlagUrl, getTeamName } from '@/lib/flags'

interface Props {
  match: Match
  prediction: Prediction | null
  userId: string
  isLocked: boolean
}

function Flag({ code, name, size = 48 }: { code: string; name: string; size?: number }) {
  const url = getFlagUrl(code, 80)
  if (!url) return <span className="text-4xl">🏳️</span>
  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded object-cover shadow-sm"
      unoptimized
    />
  )
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
      router.push('/partidos')
    }
    setSaving(false)
  }

  const btnClass = 'w-10 h-10 rounded-lg font-bold text-xl transition-all active:scale-95 bg-[#F0F7FF] text-[#236391] hover:bg-[#D6E9FA] border border-[#BBD9EE]'

  if (isLocked) {
    return (
      <div className="text-center py-4">
        {prediction ? (
          <div>
            <p className="text-[10px] text-[#4A6270] mb-4 uppercase font-mono tracking-widest">Tu predicción</p>
            <div className="flex items-center justify-center gap-5 mb-4">
              <Flag code={match.home_team_code} name={getTeamName(match.home_team_code, match.home_team)} size={48} />
              <span className="font-heading text-5xl font-bold text-[#236391]">
                {prediction.home_score} – {prediction.away_score}
              </span>
              <Flag code={match.away_team_code} name={getTeamName(match.away_team_code, match.away_team)} size={48} />
            </div>
            {prediction.points !== null && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
                prediction.points === 3 ? 'bg-green-100 text-green-700' :
                prediction.points === 1 ? 'bg-blue-100 text-blue-700' :
                'bg-red-50 text-red-600'
              }`}>
                {prediction.points === 3 ? '⚽ Resultado exacto — +3 pts' :
                 prediction.points === 1 ? '✓ Ganador correcto — +1 pt' :
                 '✗ Sin puntos'}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[#BBD9EE]">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm">No hiciste predicción para este partido.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-center text-[10px] text-[#4A6270] mb-6 uppercase font-mono tracking-widest">
        Ingresá tu predicción
      </p>

      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Flag code={match.home_team_code} name={getTeamName(match.home_team_code, match.home_team)} size={48} />
          </div>
          <p className="text-xs text-[#4A6270] mb-3 font-medium truncate max-w-[80px] mx-auto">{getTeamName(match.home_team_code, match.home_team)}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setHome(h => Math.max(0, h - 1))} className={btnClass}>−</button>
            <span className="font-heading text-4xl font-bold text-[#003049] w-10 text-center">{home}</span>
            <button onClick={() => setHome(h => h + 1)} className={btnClass}>+</button>
          </div>
        </div>

        <span className="font-heading text-3xl font-bold text-[#BBD9EE]">–</span>

        {/* Away */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Flag code={match.away_team_code} name={getTeamName(match.away_team_code, match.away_team)} size={48} />
          </div>
          <p className="text-xs text-[#4A6270] mb-3 font-medium truncate max-w-[80px] mx-auto">{getTeamName(match.away_team_code, match.away_team)}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setAway(a => Math.max(0, a - 1))} className={btnClass}>−</button>
            <span className="font-heading text-4xl font-bold text-[#003049] w-10 text-center">{away}</span>
            <button onClick={() => setAway(a => a + 1)} className={btnClass}>+</button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 py-3 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60 bg-[#236391] hover:bg-[#1a4f73]"
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
      </button>

      <p className="text-[10px] text-[#BBD9EE] text-center mt-3 font-mono uppercase tracking-widest">
        Cierra 1 hora antes del partido
      </p>
    </div>
  )
}
