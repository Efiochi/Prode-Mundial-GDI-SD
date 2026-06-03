import Link from 'next/link'
import { Match, Prediction } from '@/types'
import { format, parseISO, isBefore, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

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
  AUT: '🇦🇹', POL: '🇵🇱', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', SWE: '🇸🇪', NOR: '🇳🇴', CZE: '🇨🇿',
  MAR: '🇲🇦', SEN: '🇸🇳', NGA: '🇳🇬', EGY: '🇪🇬', CMR: '🇨🇲', CIV: '🇨🇮',
  TUN: '🇹🇳', ALG: '🇩🇿', GHA: '🇬🇭', RSA: '🇿🇦', COD: '🇨🇩',
  JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', IRN: '🇮🇷', QAT: '🇶🇦',
  KSA: '🇸🇦', IRQ: '🇮🇶', JOR: '🇯🇴', UZB: '🇺🇿', TUR: '🇹🇷', HAI: '🇭🇹',
  BIH: '🇧🇦', CPV: '🇨🇻', NZL: '🇳🇿', URY: '🇺🇾', CUW: '🇨🇼',
}

export default function MatchCard({ match, prediction }: Props) {
  const kickoff = parseISO(match.match_date)
  const locked = isBefore(subHours(kickoff, 1), new Date()) || match.status !== 'SCHEDULED'
  const finished = match.status === 'FINISHED'
  const live = match.status === 'LIVE'

  const pointsColors: Record<number, string> = {
    3: 'bg-green-100 text-green-700 border-green-200',
    1: 'bg-blue-100 text-blue-700 border-blue-200',
    0: 'bg-red-50 text-red-600 border-red-100',
  }

  const stageLabel = match.stage === 'GROUP'
    ? `Grupo ${match.group_name}`
    : match.stage.replace('_', ' ').replace('ROUND OF', 'R')

  return (
    <Link href={`/predictions/${match.id}`}>
      <div className="glass-card rounded-xl p-4 glow-hover cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-semibold text-[#4A6270] uppercase tracking-widest">
            {stageLabel}
          </span>
          <div className="flex items-center gap-2">
            {live && (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live
              </span>
            )}
            {!finished && !live && (
              <span className="text-xs text-[#4A6270]">
                {format(kickoff, 'HH:mm', { locale: es })}
              </span>
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-2xl">{FLAGS[match.home_team_code] ?? '🏳️'}</span>
            <span className="text-sm font-semibold text-[#003049] truncate">{match.home_team}</span>
          </div>

          {/* Score or VS */}
          <div className="text-center min-w-[60px]">
            {finished && match.home_score !== null ? (
              <div className="font-heading font-bold text-xl text-[#236391]">
                {match.home_score} – {match.away_score}
              </div>
            ) : (
              <div className="text-sm font-bold text-[#BBD9EE]">VS</div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className="text-sm font-semibold text-[#003049] truncate text-right">{match.away_team}</span>
            <span className="text-2xl">{FLAGS[match.away_team_code] ?? '🏳️'}</span>
          </div>
        </div>

        {/* Prediction row */}
        <div className="mt-3 pt-3 border-t border-[#BBD9EE] flex items-center justify-between">
          {prediction ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-[#4A6270]">
                Tu pronóstico: <span className="font-bold text-[#236391]">{prediction.home_score} – {prediction.away_score}</span>
              </span>
              {prediction.points !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pointsColors[prediction.points] ?? ''}`}>
                  {prediction.points === 3 ? '⚽ +3' : prediction.points === 1 ? '✓ +1' : '✗ 0'}
                </span>
              )}
            </div>
          ) : (
            <span className={`text-xs font-medium ${locked ? 'text-[#BBD9EE]' : 'text-[#74ACDF]'}`}>
              {locked ? (finished ? 'Finalizado' : 'Cerrado') : '→ Hacer predicción'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
