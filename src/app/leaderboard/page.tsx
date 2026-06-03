import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { LeaderboardEntry } from '@/types'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data }, profileResult] = await Promise.all([
    supabase.from('leaderboard').select('*').order('total_points', { ascending: false }).limit(10),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  const top10: LeaderboardEntry[] = data ?? []
  const displayName = profileResult.data?.display_name

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-[#003049] uppercase tracking-tight flex items-center gap-3">
            <span>🏆</span> Top 10
          </h1>
          <p className="text-[#4A6270] text-sm mt-1">
            3 pts resultado exacto · 1 pt ganador/empate
          </p>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {top10.length === 0 && (
            <div className="p-12 text-center text-[#4A6270]">
              <div className="text-4xl mb-3">🏆</div>
              <p>Todavía no hay puntos cargados.</p>
            </div>
          )}

          {top10.map((entry, i) => {
            const isMe = entry.user_id === user.id
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors border-b last:border-0 border-[#BBD9EE] ${
                  isMe ? 'bg-[#D6E9FA]/60' : 'hover:bg-[#F0F7FF]'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {i < 3
                    ? <span className="text-xl">{medals[i]}</span>
                    : <span className="font-mono font-bold text-sm text-[#4A6270]">{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#D6E9FA] border-2 border-[#74ACDF] flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-sm text-[#236391] uppercase">
                    {entry.display_name.charAt(0)}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#003049] text-sm truncate">
                    {entry.display_name}
                    {isMe && <span className="text-[#74ACDF] text-xs ml-2 font-mono">(vos)</span>}
                  </div>
                  <div className="text-xs text-[#4A6270] font-mono">@{entry.username}</div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex gap-4 text-xs text-[#4A6270]">
                  <div className="text-center">
                    <div className="font-bold text-[#F6B40E]">{entry.correct_results}</div>
                    <div className="font-mono uppercase tracking-widest text-[10px]">exactos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[#74ACDF]">{entry.correct_winners}</div>
                    <div className="font-mono uppercase tracking-widest text-[10px]">ganador</div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="font-heading font-bold text-xl text-[#236391]">{entry.total_points}</div>
                  <div className="text-[10px] text-[#4A6270] font-mono uppercase tracking-widest">pts</div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-[#BBD9EE] font-mono uppercase tracking-widest mt-4">
          Actualizado cada 60 segundos
        </p>
      </main>
    </div>
  )
}
