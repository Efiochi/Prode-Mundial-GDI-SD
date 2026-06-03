export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
export type MatchStage = 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL'

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  match_date: string
  stage: MatchStage
  group_name: string | null
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  api_match_id: string | null
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points: number | null
  created_at: string
  updated_at: string
}

export interface PredictionWithMatch extends Prediction {
  match: Match
}

export interface Profile {
  id: string
  username: string
  display_name: string
  total_points: number
  rank: number | null
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string
  total_points: number
  correct_results: number
  correct_winners: number
  rank: number
}

export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null
}
