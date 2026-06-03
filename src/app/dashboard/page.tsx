import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/MatchCard'
import { Match, Prediction, LeaderboardEntry } from '@/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesResult, predictionsResult, profileResult, leaderboardResult] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
    supabase.from('leaderboard').select('*').order('total_points', { ascending: false }).limit(3),
  ])

  const matches: Match[] = matchesResult.data ?? []
  const predictions: Prediction[] = predictionsResult.data ?? []
  const profile = profileResult.data
  const top3: LeaderboardEntry[] = leaderboardResult.data ?? []
  const predMap = new Map(predictions.map(p => [p.match_id, p]))

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)
  const totalPredicted = predictions.length

  // Group by date, only show upcoming/today first
  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const day = m.match_date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(m)
    return acc
  }, {})

  function dayLabel(dateStr: string) {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Hoy'
    if (isTomorrow(d)) return 'Mañana'
    return format(d, "EEEE d 'de' MMMM", { locale: es })
  }

  const displayName = profile?.display_name || profile?.username || 'Jugador'

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-7xl mx-auto px-4 md:px-16 py-6 pb-16">
        {/* Hero welcome + stats */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Welcome card */}
          <div className="lg:col-span-8 glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#74ACDF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-heading font-bold text-2xl text-[#003049] mb-1">
                ¡Hola, {displayName}!
              </h2>
              <p className="text-[#4A6270] text-sm mb-6">
                Predecí los resultados y escalá en el ranking.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-[#D6E9FA] px-5 py-3 rounded-xl border border-[#74ACDF]/20">
                  <div className="text-[10px] text-[#236391] font-mono font-semibold uppercase tracking-widest mb-0.5">Puntos</div>
                  <div className="font-heading font-bold text-3xl text-[#236391]">{totalPoints}</div>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-[#BBD9EE]">
                  <div className="text-[10px] text-[#4A6270] font-mono font-semibold uppercase tracking-widest mb-0.5">Predicciones</div>
                  <div className="font-heading font-bold text-3xl text-[#003049]">{totalPredicted}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini leaderboard */}
          <div className="lg:col-span-4 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-mono font-semibold text-[#236391] uppercase tracking-widest">
                Top 10 Leaderboard
              </h3>
              <span className="text-[#74ACDF] text-sm">🏆</span>
            </div>
            <div className="space-y-2">
              {top3.map((entry, i) => (
                <div key={entry.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0F7FF] transition-colors">
                  <span className={`w-5 text-xs font-bold ${i === 0 ? 'text-[#F6B40E]' : 'text-[#4A6270]'}`}>
                    {i + 1}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#D6E9FA] border border-[#BBD9EE] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#236391] uppercase">{entry.display_name.charAt(0)}</span>
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[#003049] truncate">{entry.display_name}</span>
                  <span className="text-sm font-bold text-[#236391]">{entry.total_points}</span>
                </div>
              ))}
            </div>
            <a href="/leaderboard" className="block mt-3 text-center text-xs text-[#74ACDF] hover:text-[#236391] font-mono uppercase tracking-widest transition-colors">
              Ver tabla completa →
            </a>
          </div>
        </section>

        {/* Matches */}
        <section>
          <h2 className="font-heading font-bold text-xl text-[#003049] mb-4 uppercase tracking-tight">
            Partidos del Mundial
          </h2>

          {Object.keys(grouped).length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center text-[#4A6270]">
              <div className="text-4xl mb-3">📅</div>
              <p>Los partidos se cargarán pronto.</p>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(grouped).map(([day, dayMatches]) => (
              <div key={day}>
                <h3 className="text-xs font-mono font-semibold text-[#74ACDF] uppercase tracking-widest mb-3 capitalize">
                  {dayLabel(day)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {dayMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predMap.get(match.id) ?? null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
