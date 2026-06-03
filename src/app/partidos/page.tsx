import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PartidosClient from '@/components/PartidosClient'
import { Match, Prediction } from '@/types'

export const revalidate = 60

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesResult, predictionsResult, profileResult] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ])

  const matches: Match[] = matchesResult.data ?? []
  const predictions: Prediction[] = predictionsResult.data ?? []
  const displayName = profileResult.data?.display_name

  const totalPredicted = predictions.length
  const totalMatches = matches.filter(m => m.home_team !== 'TBD').length

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#003049] uppercase tracking-tight">
              Todos los Partidos
            </h1>
            <p className="text-xs text-[#4A6270] font-mono mt-0.5">
              {totalPredicted} de {totalMatches} predicciones hechas
            </p>
          </div>
          <div className="hidden sm:block w-32">
            <div className="h-2 bg-[#BBD9EE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#74ACDF] rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPredicted / Math.max(1, totalMatches)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#BBD9EE] font-mono uppercase tracking-widest mt-1 text-right">
              {Math.round((totalPredicted / Math.max(1, totalMatches)) * 100)}% completo
            </p>
          </div>
        </div>

        <PartidosClient matches={matches} predictions={predictions} />
      </main>
    </div>
  )
}
