import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PredictionForm from '@/components/PredictionForm'
import { getTeamName } from '@/lib/flags'
import { format, parseISO, isBefore, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Octavos de Final',
  QUARTER_FINAL: 'Cuartos de Final',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Gran Final',
}

type GroupPrediction = {
  user_id: string
  home_score: number
  away_score: number
  points: number | null
  display_name: string
}

export default async function PredictionPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchResult, predictionResult, profileResult] = await Promise.all([
    supabase.from('matches').select('*').eq('id', matchId).single(),
    supabase.from('predictions').select('*').eq('match_id', matchId).eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  if (!matchResult.data) notFound()

  const match = matchResult.data
  const prediction = predictionResult.data
  const displayName = profileResult.data?.display_name

  const cutoff = subHours(parseISO(match.match_date), 1)
  const isLocked = isBefore(cutoff, new Date()) || match.status !== 'SCHEDULED'
  const matchDate = format(parseISO(match.match_date), "EEEE d 'de' MMMM · HH:mm", { locale: es })
  const stageLabel = match.stage === 'GROUP'
    ? `Grupo ${match.group_name} — ${STAGE_LABELS.GROUP}`
    : STAGE_LABELS[match.stage] ?? match.stage

  // Fetch all predictions for this match (only when locked — after that, picks are public)
  let groupPredictions: GroupPrediction[] = []
  if (isLocked) {
    const { data: allPreds } = await supabase
      .from('predictions')
      .select('user_id, home_score, away_score, points')
      .eq('match_id', matchId)

    if (allPreds && allPreds.length > 0) {
      const userIds = allPreds.map(p => p.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]))

      groupPredictions = allPreds.map(p => ({
        ...p,
        display_name: profileMap.get(p.user_id) ?? 'Jugador',
      }))

      // Sort: my pick first, then by points desc
      groupPredictions.sort((a, b) => {
        if (a.user_id === user.id) return -1
        if (b.user_id === user.id) return 1
        const pa = a.points ?? -1
        const pb = b.points ?? -1
        return pb - pa
      })
    }
  }

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-md mx-auto px-4 py-8 pb-16">
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Stage label */}
          <p className="text-[10px] font-mono font-semibold text-[#74ACDF] uppercase tracking-widest text-center mb-5">
            {stageLabel}
          </p>

          {/* Teams header */}
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="font-bold text-sm text-[#003049]">{getTeamName(match.home_team_code, match.home_team)}</div>
            </div>
            <div className="font-heading font-bold text-2xl text-[#BBD9EE]">VS</div>
            <div className="text-center">
              <div className="font-bold text-sm text-[#003049]">{getTeamName(match.away_team_code, match.away_team)}</div>
            </div>
          </div>

          <p className="text-center text-xs text-[#4A6270] font-mono capitalize mb-5">
            {matchDate}
          </p>

          {/* Status badges */}
          <div className="flex justify-center mb-5">
            {match.status === 'LIVE' && (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> En Vivo
              </span>
            )}
            {match.status === 'FINISHED' && match.home_score !== null && (
              <div className="bg-[#F0F7FF] border border-[#BBD9EE] rounded-xl px-6 py-3 text-center">
                <p className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest mb-1">Resultado final</p>
                <p className="font-heading font-bold text-3xl text-[#236391]">
                  {match.home_score} – {match.away_score}
                </p>
              </div>
            )}
            {isLocked && match.status === 'SCHEDULED' && (
              <span className="flex items-center gap-1.5 bg-[#F0F7FF] border border-[#BBD9EE] text-[#4A6270] text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
                🔒 Cerrado
              </span>
            )}
            {!isLocked && (
              <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
                ✓ Aceptando predicciones
              </span>
            )}
          </div>

          <div className="border-t border-[#BBD9EE] pt-5">
            <PredictionForm
              match={match}
              prediction={prediction}
              userId={user.id}
              isLocked={isLocked}
            />
          </div>

          {/* Group predictions (shown when locked) */}
          {isLocked && groupPredictions.length > 0 && (
            <div className="mt-6 border-t border-[#BBD9EE] pt-5">
              <h3 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight mb-3">
                Predicciones del grupo
                <span className="ml-2 text-[10px] font-mono text-[#BBD9EE] normal-case tracking-normal">
                  {groupPredictions.length} jugadores
                </span>
              </h3>
              <div className="space-y-2">
                {groupPredictions.map(p => (
                  <div
                    key={p.user_id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                      p.user_id === user.id ? 'bg-[#D6E9FA]/60' : 'bg-[#F0F7FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#D6E9FA] border border-[#74ACDF] flex items-center justify-center shrink-0">
                        <span className="font-bold text-[10px] text-[#236391] uppercase">
                          {p.display_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#003049]">
                        {p.display_name}
                        {p.user_id === user.id && (
                          <span className="text-[#74ACDF] font-mono text-[10px] ml-1">(vos)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[#236391]">
                        {p.home_score} – {p.away_score}
                      </span>
                      {p.points !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                          p.points === 3 ? 'bg-green-100 text-green-700 border-green-200' :
                          p.points === 1 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-red-50 text-red-500 border-red-100'
                        }`}>
                          {p.points === 3 ? '⚽ +3' : p.points === 1 ? '✓ +1' : '✗ 0'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
