import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/MatchCard'
import { Match, Prediction, LeaderboardEntry } from '@/types'
import { isToday, isTomorrow, parseISO, startOfDay, endOfDay } from 'date-fns'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()

  const [matchesResult, todayMatchesResult, predictionsResult, profileResult, leaderboardResult] =
    await Promise.all([
      // Count total scheduled matches
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      // Today's matches
      supabase
        .from('matches')
        .select('*')
        .gte('match_date', todayStart)
        .lte('match_date', todayEnd)
        .order('match_date', { ascending: true }),
      // User predictions
      supabase.from('predictions').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
      supabase.from('leaderboard').select('*').order('total_points', { ascending: false }).limit(10),
    ])

  const todayMatches: Match[] = todayMatchesResult.data ?? []
  const predictions: Prediction[] = predictionsResult.data ?? []
  const profile = profileResult.data
  const top10: LeaderboardEntry[] = leaderboardResult.data ?? []
  const predMap = new Map(predictions.map(p => [p.match_id, p]))

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)
  const correctResults = predictions.filter(p => p.points === 3).length
  const correctWinners = predictions.filter(p => p.points === 1).length

  // User rank from leaderboard
  const myRank = top10.find(e => e.user_id === user.id)?.rank ?? null

  const displayName = profile?.display_name || profile?.username || 'Jugador'
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-7xl mx-auto px-4 md:px-16 py-6 pb-16">
        {/* Stats row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[10px] font-mono font-semibold text-[#74ACDF] uppercase tracking-widest mb-1">Puntos</div>
            <div className="font-heading font-bold text-3xl text-[#236391]">{totalPoints}</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[10px] font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1">Posición</div>
            <div className="font-heading font-bold text-3xl text-[#003049]">
              {myRank ? `#${myRank}` : '—'}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[10px] font-mono font-semibold text-[#F6B40E] uppercase tracking-widest mb-1">Exactos</div>
            <div className="font-heading font-bold text-3xl text-[#003049]">{correctResults}</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-[10px] font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-1">Ganador ✓</div>
            <div className="font-heading font-bold text-3xl text-[#003049]">{correctWinners}</div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's matches */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-xl text-[#003049] uppercase tracking-tight">
                ⚽ Partidos de Hoy
              </h2>
              <Link href="/partidos"
                className="text-xs font-mono font-semibold text-[#74ACDF] hover:text-[#236391] uppercase tracking-widest transition-colors">
                Ver todos →
              </Link>
            </div>

            {todayMatches.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[#4A6270] font-medium">No hay partidos hoy.</p>
                <Link href="/partidos"
                  className="inline-block mt-4 text-sm font-semibold text-[#236391] hover:underline">
                  Ver todos los partidos →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predMap.get(match.id) ?? null}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Rules */}
          <section className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-heading font-bold text-base text-[#003049] uppercase tracking-tight mb-4">
              📋 Reglas del Prode
            </h2>
            <div className="space-y-3 text-sm text-[#4A6270]">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">⚽</span>
                <div>
                  <p className="font-semibold text-[#003049]">+3 puntos — Resultado exacto</p>
                  <p className="text-xs mt-0.5">Acertás el marcador final exacto del partido.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-[#003049]">+1 punto — Ganador correcto</p>
                  <p className="text-xs mt-0.5">Acertás quién gana o si empata, pero no el marcador exacto.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">✗</span>
                <div>
                  <p className="font-semibold text-[#003049]">0 puntos — Sin acierto</p>
                  <p className="text-xs mt-0.5">El resultado no coincide con tu predicción.</p>
                </div>
              </div>
              <div className="border-t border-[#BBD9EE] pt-3 flex items-start gap-3">
                <span className="text-lg shrink-0">🔒</span>
                <div>
                  <p className="font-semibold text-[#003049]">Cierre de predicciones</p>
                  <p className="text-xs mt-0.5">Las predicciones se cierran <span className="font-bold text-[#236391]">1 hora antes</span> del inicio de cada partido. No se pueden modificar después.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-xl text-[#003049] uppercase tracking-tight">
                🏆 Tabla de Posiciones
              </h2>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              {top10.length === 0 ? (
                <div className="p-8 text-center text-[#4A6270] text-sm">
                  Sin puntos todavía.
                </div>
              ) : (
                top10.map((entry, i) => {
                  const isMe = entry.user_id === user.id
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 border-[#BBD9EE] transition-colors ${
                        isMe ? 'bg-[#D6E9FA]/60' : 'hover:bg-[#F0F7FF]'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-6 text-center shrink-0">
                        {i < 3
                          ? <span className="text-base">{medals[i]}</span>
                          : <span className="font-mono font-bold text-xs text-[#4A6270]">{i + 1}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-[#D6E9FA] border border-[#74ACDF] flex items-center justify-center shrink-0">
                        <span className="font-bold text-xs text-[#236391] uppercase">{entry.display_name.charAt(0)}</span>
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#003049] text-sm truncate">
                          {entry.display_name}
                          {isMe && <span className="text-[#74ACDF] text-xs ml-1.5 font-mono">(vos)</span>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-[#4A6270] shrink-0">
                        <span className="hidden sm:block">
                          <span className="font-bold text-[#F6B40E]">{entry.correct_results}</span>
                          <span className="text-[#BBD9EE] mx-0.5">/</span>
                          <span className="font-bold text-[#74ACDF]">{entry.correct_winners}</span>
                        </span>
                        <span className="font-heading font-bold text-base text-[#236391] min-w-[36px] text-right">
                          {entry.total_points}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}

              {top10.length > 0 && (
                <div className="px-4 py-2 bg-[#F0F7FF] border-t border-[#BBD9EE]">
                  <p className="text-[10px] font-mono text-[#BBD9EE] uppercase tracking-widest text-center">
                    ⚽ exactos &nbsp;·&nbsp; ✓ ganador
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
