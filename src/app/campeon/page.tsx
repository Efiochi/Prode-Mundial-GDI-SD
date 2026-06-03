import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChampionPicker from './ChampionPicker'
import { getTeamName, getFlagUrl } from '@/lib/flags'
import Image from 'next/image'
import { parseISO, isBefore } from 'date-fns'

export const revalidate = 60

type AllPick = {
  user_id: string
  team_code: string
  team_name: string
  display_name: string
}

export default async function CampeonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    profileResult,
    firstMatchResult,
    myPickResult,
    allPicksResult,
    teamsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('matches').select('match_date').order('match_date', { ascending: true }).limit(1).single(),
    supabase.from('champion_predictions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('champion_predictions').select('user_id, team_code, team_name'),
    supabase
      .from('matches')
      .select('home_team_code, home_team')
      .neq('home_team', 'TBD')
      .not('home_team_code', 'is', null),
  ])

  const displayName = profileResult.data?.display_name
  const firstMatchDate = firstMatchResult.data?.match_date
  const isLocked = firstMatchDate ? isBefore(parseISO(firstMatchDate), new Date()) : false
  const myPick = myPickResult.data

  // Build unique teams list sorted by Spanish name
  const teamsMap = new Map<string, string>()
  teamsResult.data?.forEach(t => {
    if (t.home_team_code) teamsMap.set(t.home_team_code, t.home_team)
  })
  const teams = [...teamsMap.entries()]
    .map(([code, name]) => ({ code, name: getTeamName(code, name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  // Build all picks with display names
  let allPicks: AllPick[] = []
  const rawPicks = allPicksResult.data ?? []
  if (rawPicks.length > 0) {
    const pickUserIds = rawPicks.map(p => p.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', pickUserIds)
    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]))
    allPicks = rawPicks.map(p => ({
      ...p,
      display_name: profileMap.get(p.user_id) ?? 'Jugador',
    }))
    // My pick first, then alphabetically
    allPicks.sort((a, b) => {
      if (a.user_id === user.id) return -1
      if (b.user_id === user.id) return 1
      return a.display_name.localeCompare(b.display_name, 'es')
    })
  }

  // Count votes by team
  const voteCounts: Record<string, number> = {}
  rawPicks.forEach(p => {
    voteCounts[p.team_code] = (voteCounts[p.team_code] ?? 0) + 1
  })

  return (
    <div className="min-h-screen stadium-bg">
      <Navbar user={user} displayName={displayName} />

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl text-[#003049] uppercase tracking-tight">
            ⭐ Campeón del Mundial
          </h1>
          <p className="text-xs text-[#4A6270] font-mono mt-0.5">
            {isLocked
              ? 'El torneo ya comenzó — predicciones cerradas'
              : 'Elegí quién va a ganar el Mundial 2026'}
          </p>
        </div>

        {/* Picker card */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <ChampionPicker
            teams={teams}
            currentPick={myPick ? { code: myPick.team_code, name: getTeamName(myPick.team_code, myPick.team_name) } : null}
            isLocked={isLocked}
            userId={user.id}
          />
        </div>

        {/* Most picked teams (when enough data) */}
        {rawPicks.length >= 3 && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h2 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight mb-4">
              📊 Equipos más elegidos
            </h2>
            <div className="space-y-2">
              {Object.entries(voteCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([code, count]) => {
                  const pct = Math.round((count / rawPicks.length) * 100)
                  const name = getTeamName(code, code)
                  return (
                    <div key={code} className="flex items-center gap-3">
                      {getFlagUrl(code, 40) && (
                        <Image src={getFlagUrl(code, 40)} alt={name} width={24} height={16} className="rounded-sm object-cover shrink-0" unoptimized />
                      )}
                      <span className="text-sm font-medium text-[#003049] w-32 truncate">{name}</span>
                      <div className="flex-1 h-2 bg-[#BBD9EE] rounded-full overflow-hidden">
                        <div className="h-full bg-[#74ACDF] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-[#4A6270] w-8 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* All picks */}
        {allPicks.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#BBD9EE]">
              <h2 className="font-heading font-bold text-sm text-[#003049] uppercase tracking-tight">
                Predicciones del grupo
                <span className="ml-2 text-[10px] font-mono text-[#BBD9EE] normal-case tracking-normal">
                  {allPicks.length} jugadores
                </span>
              </h2>
            </div>
            {allPicks.map(pick => (
              <div
                key={pick.user_id}
                className={`flex items-center gap-3 px-5 py-3 border-b last:border-0 border-[#BBD9EE] transition-colors ${
                  pick.user_id === user.id ? 'bg-[#D6E9FA]/60' : 'hover:bg-[#F0F7FF]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#D6E9FA] border border-[#74ACDF] flex items-center justify-center shrink-0">
                  <span className="font-bold text-[10px] text-[#236391] uppercase">
                    {pick.display_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 font-medium text-sm text-[#003049] truncate">
                  {pick.display_name}
                  {pick.user_id === user.id && (
                    <span className="text-[#74ACDF] font-mono text-xs ml-1.5">(vos)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getFlagUrl(pick.team_code, 40) && (
                    <Image
                      src={getFlagUrl(pick.team_code, 40)}
                      alt={getTeamName(pick.team_code, pick.team_name)}
                      width={24}
                      height={16}
                      className="rounded-sm object-cover"
                      unoptimized
                    />
                  )}
                  <span className="text-sm font-semibold text-[#003049]">
                    {getTeamName(pick.team_code, pick.team_name)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {allPicks.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center text-[#4A6270]">
            <p className="text-sm">Todavía nadie eligió campeón. ¡Sé el primero!</p>
          </div>
        )}
      </main>
    </div>
  )
}
