import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Called by a cron job or manually with the sync secret
// GET /api/sync-results?secret=xxx
// Uses anon key + SECURITY DEFINER DB function — no service_role key needed
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  // FIFA World Cup 2026 competition ID on football-data.org
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
    { headers: { 'X-Auth-Token': apiKey } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Football API error', status: res.status }, { status: 502 })
  }

  const json = await res.json()
  const apiMatches: Array<{ id: number; score: { fullTime: { home: number | null; away: number | null } } }> =
    json.matches ?? []

  // Build results array for bulk sync
  const results = apiMatches
    .filter(m => m.score?.fullTime?.home !== null && m.score?.fullTime?.home !== undefined)
    .map(m => ({
      api_match_id: String(m.id),
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
    }))

  if (results.length === 0) {
    return NextResponse.json({ updated: 0, pointsCalculated: 0 })
  }

  // Call SECURITY DEFINER function — bypasses RLS without service_role key
  const { data, error } = await supabase.rpc('bulk_sync_results', {
    p_results: results,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
