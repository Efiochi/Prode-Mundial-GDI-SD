'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Match } from '@/types'
import { useRouter } from 'next/navigation'

interface Props {
  matches: Match[]
}

const STAGES = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL']

const emptyForm = {
  home_team: '',
  away_team: '',
  home_team_code: '',
  away_team_code: '',
  match_date: '',
  stage: 'GROUP',
  group_name: '',
  api_match_id: '',
}

export default function AdminMatchForm({ matches }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function addMatch(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase.from('matches').insert({
      ...form,
      group_name: form.group_name || null,
      api_match_id: form.api_match_id || null,
    })
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Partido agregado.')
      setForm(emptyForm)
      router.refresh()
    }
    setSaving(false)
  }

  async function updateResult(matchId: string, homeScore: number, awayScore: number) {
    const supabase = createClient()
    await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'FINISHED' })
      .eq('id', matchId)
    router.refresh()
  }

  const input = 'w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-green-500'

  return (
    <div className="space-y-8">
      {/* Add match form */}
      <section className="bg-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Agregar partido</h2>
        <form onSubmit={addMatch} className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Local</label>
            <input className={input} value={form.home_team} onChange={e => update('home_team', e.target.value)} placeholder="Argentina" required />
          </div>
          <div>
            <label className="text-xs text-gray-400">Visitante</label>
            <input className={input} value={form.away_team} onChange={e => update('away_team', e.target.value)} placeholder="Brasil" required />
          </div>
          <div>
            <label className="text-xs text-gray-400">Código local (3 letras)</label>
            <input className={input} value={form.home_team_code} onChange={e => update('home_team_code', e.target.value.toUpperCase())} placeholder="ARG" maxLength={3} required />
          </div>
          <div>
            <label className="text-xs text-gray-400">Código visitante</label>
            <input className={input} value={form.away_team_code} onChange={e => update('away_team_code', e.target.value.toUpperCase())} placeholder="BRA" maxLength={3} required />
          </div>
          <div>
            <label className="text-xs text-gray-400">Fecha y hora</label>
            <input className={input} type="datetime-local" value={form.match_date} onChange={e => update('match_date', e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-gray-400">Etapa</label>
            <select className={input} value={form.stage} onChange={e => update('stage', e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Grupo (solo fase de grupos)</label>
            <input className={input} value={form.group_name} onChange={e => update('group_name', e.target.value)} placeholder="A" maxLength={1} />
          </div>
          <div>
            <label className="text-xs text-gray-400">ID en football-data.org</label>
            <input className={input} value={form.api_match_id} onChange={e => update('api_match_id', e.target.value)} placeholder="opcional" />
          </div>
          {msg && <p className="col-span-2 text-sm text-green-400">{msg}</p>}
          <button type="submit" disabled={saving} className="col-span-2 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-sm transition-colors">
            {saving ? 'Guardando...' : 'Agregar partido'}
          </button>
        </form>
      </section>

      {/* Existing matches with result entry */}
      <section className="bg-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Cargar resultados manualmente</h2>
        <div className="space-y-2">
          {matches.filter(m => m.status !== 'FINISHED').map(m => (
            <ResultRow key={m.id} match={m} onSave={updateResult} />
          ))}
          {matches.filter(m => m.status !== 'FINISHED').length === 0 && (
            <p className="text-gray-500 text-sm">No hay partidos pendientes.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function ResultRow({ match, onSave }: { match: Match; onSave: (id: string, h: number, a: number) => void }) {
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)
  const inputCls = 'w-12 text-center px-1 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white'

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex-1 truncate">{match.home_team} vs {match.away_team}</span>
      <input type="number" min={0} max={99} value={home} onChange={e => setHome(Number(e.target.value))} className={inputCls} />
      <span className="text-gray-500">—</span>
      <input type="number" min={0} max={99} value={away} onChange={e => setAway(Number(e.target.value))} className={inputCls} />
      <button
        onClick={() => onSave(match.id, home, away)}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
      >
        Guardar
      </button>
    </div>
  )
}
