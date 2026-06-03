import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/MatchCard'
import { Match, Prediction } from '@/types'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

const STAGE_ORDER = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL']
const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Octavos de Final',
  QUARTER_FINAL: 'Cuartos de Final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: '⭐ Gran Final',
}

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesResult, predictionsResult, profileResult] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  const matches: Match[] = matchesResult.data ?? []
  const predictions: Prediction[] = predictionsResult.data ?? []
  const predMap = new Map(predictions.map(p => [p.match_id, p]))
  const displayName = profileResult.data?.display_name

  // Group by date
  const byDate = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const day = m.match_date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(m)
    return acc
  }, {})

  function dayLabel(dateStr: string): { label: string; isHighlight: boolean } {
    const d = parseISO(dateStr)
    if (isToday(d)) return { label: 'Hoy', isHighlight: true }
    if (isTomorrow(d)) return { label: 'Mañana', isHighlight: true }
    return {
      label: format(d, "EEEE d 'de' MMMM", { locale: es }),
      isHighlight: false,
    }
  }

  // Stats
  const totalPredicted = predictions.length
  const totalMatches = matches.filter(m => m.home_team !== 'TBD').length

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#003049] uppercase tracking-tight">
              Todos los Partidos
            </h1>
            <p className="text-xs text-[#4A6270] font-mono mt-0.5">
              {totalPredicted} de {totalMatches} predicciones hechas
            </p>
          </div>
          {/* Progress bar */}
          <div className="hidden sm:block w-32">
            <div className="h-2 bg-[#BBD9EE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#74ACDF] rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPredicted / Math.max(1, totalMatches)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#BBD9EE] font-mono uppercase tracking-widest mt-1 text-right">
              {Math.round((totalPredicted / Math.max(1, totalMatches)) * 100)}% completo
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-8">
          {Object.entries(byDate).map(([day, dayMatches]) => {
            const { label, isHighlight } = dayLabel(day)
            const dayPast = isPast(parseISO(day + 'T23:59:59'))

            return (
              <section key={day}>
                <div className="flex items-center gap-3 mb-3">
                  {isHighlight && (
                    <span className="bg-[#236391] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {label}
                    </span>
                  )}
                  {!isHighlight && (
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
      </main>
    </div>
  )
}
