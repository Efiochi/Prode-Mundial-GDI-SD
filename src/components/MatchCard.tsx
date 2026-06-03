import Link from 'next/link'
import { Match, Prediction } from '@/types'
import { format, parseISO, isBefore, subHours } from 'date-fns'

interface Props {
  match: Match
  prediction: Prediction | null
}

const FLAGS: Record<string, string> = {
  ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾', COL: '🇨🇴', CHI: '🇨🇱', PAR: '🇵🇾',
  PER: '🇵🇪', ECU: '🇪🇨', VEN: '🇻🇪', BOL: '🇧🇴',
  USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦', CRC: '🇨🇷', PAN: '🇵🇦', HON: '🇭🇳',
  GER: '🇩🇪', FRA: '🇫🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP: '🇪🇸', ITA: '🇮🇹', POR: '🇵🇹',
  NED: '🇳🇱', BEL: '🇧🇪', SUI: '🇨🇭', CRO: '🇭🇷', SRB: '🇷🇸', DEN: '🇩🇰',
  AUT: '🇦🇹', POL: '🇵🇱', HUN: '🇭🇺', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  MAR: '🇲🇦', SEN: '🇸🇳', NGA: '🇳🇬', EGY: '🇪🇬', CMR: '🇨🇲', CIV: '🇨🇮',
  JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', IRN: '🇮🇷', SAU: '🇸🇦', QAT: '🇶🇦',
}

export default function MatchCard({ match, prediction }: Props) {
  const kickoff = parseISO(match.match_date)
  const locked = isBefore(subHours(kickoff, 1), new Date()) || match.status !== 'SCHEDULED'
  const finished = match.status === 'FINISHED'

  const pointsColor =
    prediction?.points === 3 ? 'text-green-400' :
    prediction?.points === 1 ? 'text-blue-400' :
    prediction?.points === 0 ? 'text-red-400' :
    'text-gray-400'

  return (
    <Link href={`/predictions/${match.id}`}>
      <div className={`bg-gray-800 hover:bg-gray-750 rounded-xl p-4 transition-colors border ${
        locked ? 'border-gray-700' : 'border-gray-700 hover:border-green-700'
      }`}>
        <div className="flex items-center gap-3">
          {/* Teams */}
          <div className="flex-1 flex items-center gap-2">
            <span>{FLAGS[match.home_team_code] ?? '🏳️'}</span>
            <span className="font-medium text-sm">{match.home_team}</span>
          </div>

          {/* Score / Time */}
          <div className="text-center px-2 min-w-[80px]">
            {finished && match.home_score !== null ? (
              <div className="font-bold text-lg">
                {match.home_score} — {match.away_score}
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {format(kickoff, 'HH:mm')}
              </div>
            )}
            {match.status === 'LIVE' && (
              <span className="text-xs text-red-400 animate-pulse">EN VIVO</span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-end gap-2">
            <span className="font-medium text-sm">{match.away_team}</span>
            <span>{FLAGS[match.away_team_code] ?? '🏳️'}</span>
          </div>
        </div>

        {/* Prediction row */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            {locked ? (finished ? 'Finalizado' : 'Cerrado') : 'Hacer predicción →'}
          </span>
          {prediction ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">
                Tu pronóstico: {prediction.home_score} — {prediction.away_score}
              </span>
              {prediction.points !== null && (
                <span className={`font-bold text-sm ${pointsColor}`}>
                  +{prediction.points}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-xs">Sin predicción</span>
          )}
        </div>
      </div>
    </Link>
  )
}
