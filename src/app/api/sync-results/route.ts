import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { calculatePoints } from '@/lib/scoring'

// Called by a cron job or manually with the sync secret
// GET /api/sync-results?secret=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  // FIFA World Cup 2026 competition ID on football-data.org
  const competitionId = 'WC'
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competitionId}/matches?status=FINISHED`,
    { headers: { 'X-Auth-Token': apiKey } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Football API error', status: res.status }, { status: 502 })
  }

  const json = await res.json()
  const apiMatches = json.matches ?? []

  let updated = 0
  let pointsCalculated = 0

  for (const apiMatch of apiMatches) {
    const homeScore = apiMatch.score?.fullTime?.home
    const awayScore = apiMatch.score?.fullTime?.away
    if (homeScore === null || homeScore === undefined) continue

    // Match by api_match_id
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('api_match_id', String(apiMatch.id))
      .maybeSingle()

    if (!match) continue

    // Update match result
    await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'FINISHED' })
      .eq('id', match.id)

    updated++

    // Recalculate points for all predictions on this match
    const { data: predictions } = await supabase
      .from('predictions')
      .select('id, home_score, away_score')
      .eq('match_id', match.id)

    if (!predictions) continue

    for (const pred of predictions) {
      const points = calculatePoints(pred.home_score, pred.away_score, homeScore, awayScore)
      await supabase
        .from('predictions')
        .update({ points })
        .eq('id', pred.id)
      pointsCalculated++
    }
  }

  return NextResponse.json({ updated, pointsCalculated })
}
