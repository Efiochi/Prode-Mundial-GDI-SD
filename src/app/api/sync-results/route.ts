import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config'
import { handleOptions, withCors } from '@/lib/cors'

const STATUS_MAP: Record<string, string> = {
  TIMED: 'SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  IN_PLAY: 'LIVE',
  PAUSED: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
}

export async function OPTIONS(request: Request) {
  return handleOptions(request) ?? new NextResponse(null, { status: 405 })
}

// GET /api/sync-results?secret=xxx
// Syncs results + team names (TBD→real) + status for all matches
export async function GET(request: Request) {
  const preflight = handleOptions(request)
  if (preflight) return preflight

  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.SYNC_SECRET) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  // Fetch ALL matches (not just finished) so team names update too
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches',
    { headers: { 'X-Auth-Token': apiKey }, next: { revalidate: 0 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Football API error', status: res.status }, { status: 502 })
  }

  const json = await res.json()
  const apiMatches = json.matches ?? []

  const results = apiMatches.map((m: {
    id: number
    status: string
    homeTeam: { name?: string; tla?: string } | null
    awayTeam: { name?: string; tla?: string } | null
    score: { fullTime: { home: number | null; away: number | null } }
  }) => ({
    api_match_id: String(m.id),
    status: STATUS_MAP[m.status] ?? 'SCHEDULED',
    home_team: m.homeTeam?.name ?? null,
    away_team: m.awayTeam?.name ?? null,
    home_team_code: m.homeTeam?.tla ?? null,
    away_team_code: m.awayTeam?.tla ?? null,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
  }))

  const { data, error } = await supabase.rpc('bulk_sync_results', {
    p_results: results,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return withCors(
    NextResponse.json({ ...data, total_matches_processed: results.length }),
    request
  )
}
