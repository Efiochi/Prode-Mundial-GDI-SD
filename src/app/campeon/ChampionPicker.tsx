'use client'
import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getFlagUrl } from '@/lib/flags'

interface Team {
  code: string
  name: string
}

interface Props {
  teams: Team[]
  currentPick: Team | null
  isLocked: boolean
  userId: string
}

export default function ChampionPicker({ teams, currentPick: initialPick, isLocked, userId }: Props) {
  const [pick, setPick] = useState<Team | null>(initialPick)
  const [picking, setPicking] = useState(!initialPick && !isLocked)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const filteredTeams = search
    ? teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams

  async function savePick(team: Team) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('champion_predictions')
      .upsert(
        { user_id: userId, team_code: team.code, team_name: team.name, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (err) {
      setError('Error al guardar. Intentá de nuevo.')
    } else {
      setPick(team)
      setSaved(true)
      setPicking(false)
      setSearch('')
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // Locked state
  if (isLocked) {
    return (
      <div className="text-center py-4">
        <p className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest mb-4">Tu predicción</p>
        {pick ? (
          <div className="flex flex-col items-center gap-3">
            {getFlagUrl(pick.code, 80) && (
              <Image
                src={getFlagUrl(pick.code, 80)}
                alt={pick.name}
                width={80}
                height={54}
                className="rounded-lg shadow-md"
                unoptimized
              />
            )}
            <div className="font-heading font-bold text-2xl text-[#003049]">{pick.name}</div>
            <div className="text-xs text-[#4A6270] font-mono">🔒 Predicciones cerradas — el torneo ya comenzó</div>
          </div>
        ) : (
          <div className="text-[#BBD9EE]">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm">No hiciste tu predicción antes de que empezara el torneo.</p>
          </div>
        )}
      </div>
    )
  }

  // Team picker view
  if (picking) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#003049]">
            {pick ? 'Cambiar predicción' : '¿Quién va a ganar el Mundial?'}
          </p>
          {pick && (
            <button
              onClick={() => { setPicking(false); setSearch('') }}
              className="text-xs text-[#4A6270] hover:text-[#236391] transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] text-sm mb-3 focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
          {filteredTeams.map(team => (
            <button
              key={team.code}
              onClick={() => savePick(team)}
              disabled={saving}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left disabled:opacity-60 ${
                pick?.code === team.code
                  ? 'bg-[#D6E9FA] border-[#74ACDF]'
                  : 'bg-[#F0F7FF] border-[#BBD9EE] hover:bg-[#D6E9FA] hover:border-[#74ACDF]'
              }`}
            >
              {getFlagUrl(team.code, 40) && (
                <Image
                  src={getFlagUrl(team.code, 40)}
                  alt={team.name}
                  width={24}
                  height={16}
                  className="rounded-sm object-cover shrink-0"
                  unoptimized
                />
              )}
              <span className="text-xs font-medium text-[#003049] truncate">{team.name}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}
      </div>
    )
  }

  // Current pick view
  return (
    <div className="text-center py-2">
      <p className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest mb-4">Tu predicción</p>
      <div className="flex flex-col items-center gap-3 mb-5">
        {pick && getFlagUrl(pick.code, 80) && (
          <Image
            src={getFlagUrl(pick.code, 80)}
            alt={pick.name}
            width={80}
            height={54}
            className="rounded-lg shadow-md"
            unoptimized
          />
        )}
        <div className="font-heading font-bold text-2xl text-[#003049]">{pick?.name}</div>
        {saved && <div className="text-green-600 text-xs font-mono font-bold">✓ Guardado</div>}
      </div>
      <button
        onClick={() => setPicking(true)}
        className="px-6 py-2 bg-[#F0F7FF] text-[#236391] text-sm font-bold rounded-xl border border-[#BBD9EE] hover:bg-[#D6E9FA] transition-all active:scale-95"
      >
        Cambiar equipo
      </button>
    </div>
  )
}
