import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PredictionForm from '@/components/PredictionForm'
import { format, parseISO, isBefore, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function PredictionPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchResult, predictionResult] = await Promise.all([
    supabase.from('matches').select('*').eq('id', matchId).single(),
    supabase.from('predictions').select('*').eq('match_id', matchId).eq('user_id', user.id).maybeSingle(),
  ])

  if (!matchResult.data) notFound()

  const match = matchResult.data
  const prediction = predictionResult.data

  // Lock predictions 1 hour before kickoff
  const cutoff = subHours(parseISO(match.match_date), 1)
  const isLocked = isBefore(cutoff, new Date()) || match.status !== 'SCHEDULED'

  const matchDateFormatted = format(
    parseISO(match.match_date),
    "EEEE d 'de' MMMM · HH:mm",
    { locale: es }
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 capitalize">
              {match.stage === 'GROUP' ? `Grupo ${match.group_name}` : match.stage}
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-3xl mb-1">{flagEmoji(match.home_team_code)}</div>
                <div className="font-semibold">{match.home_team}</div>
              </div>
              <div className="text-2xl font-bold text-gray-500">vs</div>
              <div className="text-center">
                <div className="text-3xl mb-1">{flagEmoji(match.away_team_code)}</div>
                <div className="font-semibold">{match.away_team}</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4 capitalize">{matchDateFormatted}</p>
          </div>

          {match.status === 'FINISHED' && match.home_score !== null && (
            <div className="text-center mb-6 py-3 bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Resultado final</p>
              <p className="text-2xl font-bold">
                {match.home_score} — {match.away_score}
              </p>
            </div>
          )}

          <PredictionForm
            match={match}
            prediction={prediction}
            userId={user.id}
            isLocked={isLocked}
          />
        </div>
      </main>
    </div>
  )
}

function flagEmoji(code: string): string {
  const flags: Record<string, string> = {
    ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾', COL: '🇨🇴', CHI: '🇨🇱', PAR: '🇵🇾',
    PER: '🇵🇪', ECU: '🇪🇨', VEN: '🇻🇪', BOL: '🇧🇴',
    USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦', CRC: '🇨🇷', PAN: '🇵🇦', HON: '🇭🇳',
    GER: '🇩🇪', FRA: '🇫🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP: '🇪🇸', ITA: '🇮🇹', POR: '🇵🇹',
    NED: '🇳🇱', BEL: '🇧🇪', SUI: '🇨🇭', CRO: '🇭🇷', SRB: '🇷🇸', DEN: '🇩🇰',
    AUT: '🇦🇹', POL: '🇵🇱', HUN: '🇭🇺', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    MAR: '🇲🇦', SEN: '🇸🇳', NGA: '🇳🇬', EGY: '🇪🇬', CMR: '🇨🇲', CIV: '🇨🇮',
    JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', IRN: '🇮🇷', SAU: '🇸🇦', QAT: '🇶🇦',
  }
  return flags[code] ?? '🏳️'
}
