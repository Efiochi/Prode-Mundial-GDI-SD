import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/MatchCard'
import { Match, Prediction } from '@/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesResult, predictionsResult] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true }),
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id),
  ])

  const matches: Match[] = matchesResult.data ?? []
  const predictions: Prediction[] = predictionsResult.data ?? []
  const predMap = new Map(predictions.map(p => [p.match_id, p]))

  // Group matches by date
  const grouped = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const day = match.match_date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(match)
    return acc
  }, {})

  function dayLabel(dateStr: string) {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Hoy'
    if (isTomorrow(d)) return 'Mañana'
    return format(d, "EEEE d 'de' MMMM", { locale: es })
  }

  const totalPredicted = predictions.length
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{totalPoints}</div>
            <div className="text-xs text-gray-400 mt-1">puntos totales</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{totalPredicted}</div>
            <div className="text-xs text-gray-400 mt-1">predicciones hechas</div>
          </div>
        </div>

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📅</div>
            <p>Los partidos se cargarán pronto.</p>
          </div>
        )}

        {Object.entries(grouped).map(([day, dayMatches]) => (
          <section key={day} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 capitalize">
              {dayLabel(day)}
            </h2>
            <div className="space-y-3">
              {dayMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
