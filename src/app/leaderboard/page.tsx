import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { LeaderboardEntry } from '@/types'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(10)

  const top10: LeaderboardEntry[] = data ?? []

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>🏆</span> Top 10
        </h1>

        {top10.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🏆</div>
            <p>Todavía no hay puntos cargados.</p>
          </div>
        )}

        <div className="space-y-2">
          {top10.map((entry, i) => {
            const isMe = entry.user_id === user.id
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                  isMe
                    ? 'bg-green-900/40 border border-green-700'
                    : 'bg-gray-800'
                }`}
              >
                <span className="w-8 text-center text-lg font-bold">
                  {i < 3 ? medals[i] : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {entry.display_name}
                    {isMe && <span className="text-green-400 text-xs ml-2">(vos)</span>}
                  </div>
                  <div className="text-xs text-gray-400">@{entry.username}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">{entry.total_points}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400">
                    <span className="text-yellow-400">{entry.correct_results}</span> exactos
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-blue-400">{entry.correct_winners}</span> ganador
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-xs text-gray-600 text-center">
          Actualizado cada 60 segundos · 3 pts resultado exacto · 1 pt ganador/empate
        </div>
      </main>
    </div>
  )
}
