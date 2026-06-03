import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProfileEditForm from './ProfileEditForm'
import ShareCard from './ShareCard'

export const revalidate = 0

type PredWithMatch = {
  home_score: number
  away_score: number
  points: number | null
  matches: {
    match_date: string
    status: string
    group_name: string | null
    stage: string
  }
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, predsResult, lbResult] = await Promise.all([
    supabase.from('profiles').select('display_name, username').eq('id', user.id).single(),
    supabase
      .from('predictions')
      .select('home_score, away_score, points, matches(match_date, status, group_name, stage)')
      .eq('user_id', user.id),
    supabase
      .from('leaderboard')
      .select('rank, total_points, correct_results, correct_winners')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const preds = (predsResult.data ?? []) as unknown as PredWithMatch[]
  const lb = lbResult.data

  // Stats
  const finished = preds.filter(p => p.matches?.status === 'FINISHED')
  const exactos = preds.filter(p => p.points === 3).length
  const ganadores = preds.filter(p => p.points === 1).length
  const misses = preds.filter(p => p.points === 0).length
  const totalFinished = finished.length

  const pctAciertos = totalFinished > 0
    ? Math.round(((exactos + ganadores) / totalFinished) * 100)
    : 0

  // Streak (consecutive correct from most recent)
  const sortedFinished = [...finished]
    .sort((a, b) => new Date(b.matches.match_date).getTime() - new Date(a.matches.match_date).getTime())
  let streak = 0
  for (const p of sortedFinished) {
    if ((p.points ?? 0) > 0) streak++
    else break
  }

  // Best group
  const groupPts: Record<string, number> = {}
  for (const p of preds) {
    if (p.matches?.group_name && p.points !== null) {
      const g = p.matches.group_name
      groupPts[g] = (groupPts[g] ?? 0) + p.points
    }
  }
  const bestGroupEntry = Object.entries(groupPts).sort((a, b) => b[1] - a[1])[0]

  const displayName = profile?.display_name ?? profile?.username ?? 'Jugador'

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#003049] uppercase tracking-tight">
              Mi Perfil
            </h1>
            <p className="text-xs text-[#4A6270] font-mono mt-0.5">@{profile?.username}</p>
          </div>
          <Link
            href="/mis-predicciones"
            className="text-xs font-mono font-semibold text-[#74ACDF] hover:text-[#236391] uppercase tracking-widest transition-colors"
          >
            Ver mis picks →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: stats + share */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight mb-4">
                📊 Estadísticas
              </h2>

              {/* Top 4 stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#F0F7FF] rounded-xl p-3 text-center">
                  <div className="font-heading font-bold text-3xl text-[#236391]">
                    {lb?.total_points ?? 0}
                  </div>
                  <div className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest">Puntos</div>
                </div>
                <div className="bg-[#F0F7FF] rounded-xl p-3 text-center">
                  <div className="font-heading font-bold text-3xl text-[#003049]">
                    {lb?.rank ? `#${lb.rank}` : '—'}
                  </div>
                  <div className="text-[10px] font-mono text-[#4A6270] uppercase tracking-widest">Posición</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="font-heading font-bold text-3xl text-green-600">{exactos}</div>
                  <div className="text-[10px] font-mono text-green-600 uppercase tracking-widest">Exactos</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="font-heading font-bold text-3xl text-blue-600">{ganadores}</div>
                  <div className="text-[10px] font-mono text-blue-600 uppercase tracking-widest">Ganadores</div>
                </div>
              </div>

              {/* Detail stats */}
              <div className="space-y-0">
                {[
                  { label: '% Aciertos', value: pctAciertos > 0 ? `${pctAciertos}%` : '—' },
                  { label: 'Racha actual', value: streak > 0 ? `🔥 ${streak} seguidos` : '—' },
                  { label: 'Sin acierto', value: `${misses}`, valueClass: 'text-red-500' },
                  {
                    label: 'Mejor grupo',
                    value: bestGroupEntry ? `Grupo ${bestGroupEntry[0]} (${bestGroupEntry[1]} pts)` : '—',
                  },
                  { label: 'Predicciones', value: `${preds.length}` },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b last:border-0 border-[#BBD9EE]">
                    <span className="text-[#4A6270] font-mono text-xs uppercase tracking-wide">{label}</span>
                    <span className={`font-bold text-sm ${valueClass ?? 'text-[#003049]'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share card */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight mb-4">
                📤 Compartir
              </h2>
              <ShareCard
                displayName={displayName}
                rank={lb?.rank ?? null}
                points={lb?.total_points ?? 0}
                exactos={exactos}
                ganadores={ganadores}
                pctAciertos={pctAciertos}
              />
            </div>
          </div>

          {/* Right: edit profile */}
          <div className="glass-card rounded-2xl p-5 h-fit">
            <h2 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight mb-5">
              ✏️ Editar perfil
            </h2>
            <ProfileEditForm displayName={displayName} userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
