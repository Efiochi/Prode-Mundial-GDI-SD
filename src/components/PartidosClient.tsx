'use client'
import { useState, useMemo } from 'react'
import MatchCard from '@/components/MatchCard'
import { Match, Prediction } from '@/types'
import { format, isToday, isTomorrow, isPast, parseISO, isBefore, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  matches: Match[]
  predictions: Prediction[]
}

type StatusFilter = 'all' | 'pending' | 'live' | 'finished'

export default function PartidosClient({ matches, predictions }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [groupFilter, setGroupFilter] = useState('all')

  const predMap = useMemo(() =>
    new Map(predictions.map(p => [p.match_id, p])), [predictions])

  const groups = useMemo(() => {
    const set = new Set<string>()
    matches.forEach(m => { if (m.group_name) set.add(m.group_name) })
    return [...set].sort()
  }, [matches])

  const hasKnockout = matches.some(m => m.stage !== 'GROUP')

  const filtered = useMemo(() => {
    return matches.filter(m => {
      // Group filter
      if (groupFilter === 'knockout') {
        if (m.stage === 'GROUP') return false
      } else if (groupFilter !== 'all') {
        if (m.group_name !== groupFilter) return false
      }

      // Status filter
      const kickoff = parseISO(m.match_date)
      const locked = isBefore(subHours(kickoff, 1), new Date()) || m.status !== 'SCHEDULED'

      if (statusFilter === 'pending') {
        return m.status === 'SCHEDULED' && !locked && !predMap.has(m.id)
      }
      if (statusFilter === 'live') return m.status === 'LIVE'
      if (statusFilter === 'finished') return m.status === 'FINISHED'

      return true
    })
  }, [matches, statusFilter, groupFilter, predMap])

  const byDate = useMemo(() => {
    return filtered.reduce<Record<string, Match[]>>((acc, m) => {
      const day = m.match_date.slice(0, 10)
      if (!acc[day]) acc[day] = []
      acc[day].push(m)
      return acc
    }, {})
  }, [filtered])

  function dayLabel(dateStr: string) {
    const d = parseISO(dateStr)
    if (isToday(d)) return { label: 'Hoy', isHighlight: true }
    if (isTomorrow(d)) return { label: 'Mañana', isHighlight: true }
    return { label: format(d, "EEEE d 'de' MMMM", { locale: es }), isHighlight: false }
  }

  const btnStatus = (key: string) =>
    `px-3 py-1 text-xs font-mono font-semibold rounded-full transition-all ${
      statusFilter === key
        ? 'bg-[#236391] text-white'
        : 'bg-[#F0F7FF] text-[#4A6270] hover:bg-[#D6E9FA]'
    }`

  const btnGroup = (key: string) =>
    `px-3 py-1 text-xs font-mono font-semibold rounded-full transition-all ${
      groupFilter === key
        ? 'bg-[#003049] text-white'
        : 'bg-[#F0F7FF] text-[#4A6270] hover:bg-[#D6E9FA]'
    }`

  return (
    <div>
      {/* Filters */}
      <div className="space-y-2 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setStatusFilter('all')} className={btnStatus('all')}>Todos</button>
          <button onClick={() => setStatusFilter('pending')} className={btnStatus('pending')}>Sin predecir</button>
          <button onClick={() => setStatusFilter('live')} className={btnStatus('live')}>🔴 En vivo</button>
          <button onClick={() => setStatusFilter('finished')} className={btnStatus('finished')}>Terminados</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setGroupFilter('all')} className={btnGroup('all')}>Todos</button>
          {groups.map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} className={btnGroup(g)}>
              Gr. {g}
            </button>
          ))}
          {hasKnockout && (
            <button onClick={() => setGroupFilter('knockout')} className={btnGroup('knockout')}>
              Eliminatorias
            </button>
          )}
        </div>
      </div>

      {/* Match list */}
      {Object.keys(byDate).length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#4A6270]">No hay partidos con ese filtro.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byDate).map(([day, dayMatches]) => {
            const { label, isHighlight } = dayLabel(day)
            const dayPast = isPast(parseISO(day + 'T23:59:59'))
            return (
              <section key={day}>
                <div className="flex items-center gap-3 mb-3">
                  {isHighlight ? (
                    <span className="bg-[#236391] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {label}
                    </span>
                  ) : (
                    <h3 className={`text-xs font-mono font-semibold uppercase tracking-widest capitalize ${
                      dayPast ? 'text-[#BBD9EE]' : 'text-[#74ACDF]'
                    }`}>
                      {label}
                    </h3>
                  )}
                  <div className="flex-1 h-px bg-[#BBD9EE]" />
                  <span className="text-[10px] font-mono text-[#BBD9EE]">
                    {dayMatches.filter(m => predMap.has(m.id)).length}/{dayMatches.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dayMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predMap.get(match.id) ?? null}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
