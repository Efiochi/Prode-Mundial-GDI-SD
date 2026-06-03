import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import { Match } from '@/types'
import { getFlagUrl, getTeamName } from '@/lib/flags'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

type PredWithMatch = {
  id: string
  home_score: number
  away_score: number
  points: number | null
  match_id: string
  matches: Match
}

function Flag({ code, name }: { code: string; name: string }) {
  const url = getFlagUrl(code, 40)
  if (!url) return null
  return (
    <Image
      src={url}
      alt={name}
      width={20}
      height={14}
      className="rounded-sm object-cover shrink-0"
      unoptimized
    />
  )
}

function PredCard({ pred }: { pred: PredWithMatch }) {
  const m = pred.matches
  const home = getTeamName(m.home_team_code, m.home_team)
  const away = getTeamName(m.away_team_code, m.away_team)
  const date = format(parseISO(m.match_date), "d MMM · HH:mm", { locale: es })

  const pointsBadge =
    pred.points === 3 ? 'bg-green-100 text-green-700 border-green-200' :
    pred.points === 1 ? 'bg-blue-100 text-blue-700 border-blue-200' :
    pred.points === 0 ? 'bg-red-50 text-red-500 border-red-100' :
    'bg-[#F0F7FF] text-[#4A6270] border-[#BBD9EE]'

  const pointsLabel =
    pred.points === 3 ? '⚽ +3' :
    pred.points === 1 ? '✓ +1' :
    pred.points === 0 ? '✗ 0' : '—'

  return (
    <Link href={`/predictions/${m.id}`} className="block">
      <div className="glass-card rounded-xl p-3 hover:bg-[#F0F7FF] transition-colors">
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Flag code={m.home_team_code} name={home} />
            <span className="text-xs font-medium text-[#003049] truncate">{home}</span>
          </div>

          {/* Score */}
          <div className="text-center shrink-0 min-w-[60px]">
            <div className="font-heading font-bold text-sm text-[#236391]">
              {pred.home_score} – {pred.away_score}
            </div>
            {m.status === 'FINISHED' && m.home_score !== null && (
              <div className="text-[10px] text-[#4A6270] font-mono">
                Real: {m.home_score}–{m.away_score}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
            <span className="text-xs font-medium text-[#003049] truncate text-right">{away}</span>
            <Flag code={m.away_team_code} name={away} />
          </div>

          {/* Badge */}
          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${pointsBadge}`}>
            {pointsLabel}
          </span>
        </div>

        <div className="text-[10px] text-[#BBD9EE] font-mono mt-1.5 capitalize">
          {date} · {m.group_name ? `Grupo ${m.group_name}` : m.stage.replace(/_/g, ' ')}
        </div>
      </div>
    </Link>
  )
}

function Section({
  title,
  items,
  color,
}: {
  title: string
  items: PredWithMatch[]
  color: string
}) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${color}`}>{title}</h2>
        <div className="flex-1 h-px bg-[#BBD9EE]" />
        <span className="text-[10px] font-mono text-[#BBD9EE]">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(p => (
          <PredCard key={p.id} pred={p} />
        ))}
      </div>
    </div>
  )
}

export default async function MisPrediccionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [predsResult, profileResult] = await Promise.all([
    supabase
      .from('predictions')
      .select('id, home_score, away_score, points, match_id, matches(*)')
      .eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  const predictions = (predsResult.data ?? []) as unknown as PredWithMatch[]
  const displayName = profileResult.data?.display_name

  // Sort by match date asc
  predictions.sort((a, b) =>
    new Date(a.matches.match_date).getTime() - new Date(b.matches.match_date).getTime()
  )

  const exactos = predictions.filter(p => p.points === 3)
  const ganadores = predictions.filter(p => p.points === 1)
  const misses = predictions.filter(p => p.points === 0)
  const pending = predictions.filter(p => p.points === null)

  const totalPoints = exactos.length * 3 + ganadores.length
  const totalFinished = exactos.length + ganadores.length + misses.length
  const pctAciertos = totalFinished > 0
    ? Math.round(((exactos.length + ganadores.length) / totalFinished) * 100)
    : 0

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#003049] uppercase tracking-tight">
              Mis Predicciones
            </h1>
            <p className="text-xs text-[#4A6270] font-mono mt-0.5">
              {predictions.length} predicciones · {totalPoints} puntos
            </p>
          </div>
          {totalFinished > 0 && (
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-[#236391]">{pctAciertos}%</div>
              <div className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest">aciertos</div>
            </div>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-[#4A6270]">Todavía no hiciste predicciones.</p>
            <Link
              href="/partidos"
              className="inline-block mt-4 text-sm font-semibold text-[#236391] hover:underline"
            >
              Ver partidos →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <Section title="⚽ Exactos" items={exactos} color="text-green-600" />
            <Section title="✓ Ganador correcto" items={ganadores} color="text-blue-600" />
            <Section title="✗ Sin acierto" items={misses} color="text-red-500" />
            <Section title="📅 Pendientes" items={pending} color="text-[#74ACDF]" />
          </div>
        )}
      </main>
    </div>
  )
}
