// 3 pts for exact score, 1 pt for correct winner/draw, 0 otherwise
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 3

  const predictedOutcome = Math.sign(predictedHome - predictedAway)
  const actualOutcome = Math.sign(actualHome - actualAway)
  if (predictedOutcome === actualOutcome) return 1

  return 0
}

export function getOutcomeLabel(home: number, away: number): string {
  if (home > away) return 'Local'
  if (away > home) return 'Visitante'
  return 'Empate'
}
