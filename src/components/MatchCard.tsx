import Link from 'next/link'
import Image from 'next/image'
import { Match, Prediction } from '@/types'
import { format, parseISO, isBefore, subHours } from 'date-fns'
import { getFlagUrl, getTeamName } from '@/lib/flags'

interface Props {
  match: Match
  prediction: Prediction | null
}

function Flag({ code, name, size = 32 }: { code: string; name: string; size?: number }) {
  const url = getFlagUrl(code, 40)
  if (!url) return <span className="text-2xl">🏳️</span>
  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={size * 0.67}
      className="rounded-sm object-cover shadow-sm"
      unoptimized
    />
  )
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
    : match.stage.replace(/_/g, ' ')

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
                {format(kickoff, 'HH:mm')}
              </span>
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <Flag code={match.home_team_code} name={getTeamName(match.home_team_code, match.home_team)} size={28} />
            <span className="text-sm font-semibold text-[#003049] truncate">{getTeamName(match.home_team_code, match.home_team)}</span>
          </div>

          {/* Score or VS */}
          <div className="text-center min-w-[56px] flex-shrink-0">
            {finished && match.home_score !== null ? (
              <div className="font-heading font-bold text-lg text-[#236391]">
                {match.home_score} – {match.away_score}
              </div>
            ) : (
              <div className="text-sm font-bold text-[#BBD9EE]">VS</div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
            <span className="text-sm font-semibold text-[#003049] truncate text-right">{getTeamName(match.away_team_code, match.away_team)}</span>
            <Flag code={match.away_team_code} name={getTeamName(match.away_team_code, match.away_team)} size={28} />
          </div>
        </div>

        {/* Prediction row */}
        <div className="mt-3 pt-3 border-t border-[#BBD9EE] flex items-center justify-between">
          {prediction ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-[#4A6270]">
                Pronóstico: <span className="font-bold text-[#236391]">{prediction.home_score} – {prediction.away_score}</span>
              </span>
              {prediction.points !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${pointsColors[prediction.points] ?? ''}`}>
                  {prediction.points === 3 ? '⚽ +3' : prediction.points === 1 ? '✓ +1' : '✗ 0'}
                </span>
              )}
            </div>
          ) : (
            <span className={`text-xs font-medium ${locked ? 'text-[#BBD9EE]' : 'text-[#74ACDF]'}`}>
              {locked ? (finished ? 'Finalizado' : '🔒 Cerrado') : '→ Hacer predicción'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
