// Maps 3-letter TLA codes → ISO 3166-1 alpha-2 for flagcdn.com
const TLA_TO_ISO2: Record<string, string> = {
  // South America
  ARG: 'ar', BRA: 'br', URU: 'uy', COL: 'co', CHI: 'cl',
  PAR: 'py', PER: 'pe', ECU: 'ec', VEN: 've', BOL: 'bo',
  // CONCACAF
  USA: 'us', MEX: 'mx', CAN: 'ca', CRC: 'cr', PAN: 'pa',
  HON: 'hn', HAI: 'ht',
  // Europe
  GER: 'de', FRA: 'fr', ESP: 'es', ITA: 'it', POR: 'pt',
  NED: 'nl', BEL: 'be', SUI: 'ch', CRO: 'hr', SRB: 'rs',
  DEN: 'dk', AUT: 'at', POL: 'pl', SWE: 'se', NOR: 'no',
  CZE: 'cz', HUN: 'hu', TUR: 'tr', BIH: 'ba', UZB: 'uz',
  // UK nations (flagcdn.com special codes)
  ENG: 'gb-eng', SCO: 'gb-sct', WAL: 'gb-wls',
  // Africa
  MAR: 'ma', SEN: 'sn', NGA: 'ng', EGY: 'eg', CMR: 'cm',
  CIV: 'ci', TUN: 'tn', ALG: 'dz', GHA: 'gh', RSA: 'za',
  COD: 'cd', CPV: 'cv',
  // Asia / Oceania / Middle East
  JPN: 'jp', KOR: 'kr', AUS: 'au', IRN: 'ir', QAT: 'qa',
  KSA: 'sa', IRQ: 'iq', JOR: 'jo', NZL: 'nz', CUW: 'cw',
}

export function getFlagUrl(tla: string, size: 40 | 80 | 160 = 40): string {
  const iso2 = TLA_TO_ISO2[tla]
  if (!iso2) return ''
  return `https://flagcdn.com/w${size}/${iso2}.png`
}

export function getFlagAlt(teamName: string): string {
  return `Bandera de ${teamName}`
}

// Spanish team names by TLA code
const TEAM_NAMES_ES: Record<string, string> = {
  ALG: 'Argelia',
  ARG: 'Argentina',
  AUS: 'Australia',
  AUT: 'Austria',
  BEL: 'Bélgica',
  BIH: 'Bosnia y Herzegovina',
  BOL: 'Bolivia',
  BRA: 'Brasil',
  CAN: 'Canadá',
  CHI: 'Chile',
  CIV: 'Costa de Marfil',
  CMR: 'Camerún',
  COD: 'Congo RD',
  COL: 'Colombia',
  CPV: 'Cabo Verde',
  CRC: 'Costa Rica',
  CRO: 'Croacia',
  CUW: 'Curazao',
  CZE: 'República Checa',
  DEN: 'Dinamarca',
  ECU: 'Ecuador',
  EGY: 'Egipto',
  ENG: 'Inglaterra',
  ESP: 'España',
  FRA: 'Francia',
  GER: 'Alemania',
  GHA: 'Ghana',
  HAI: 'Haití',
  HON: 'Honduras',
  HUN: 'Hungría',
  IRN: 'Irán',
  IRQ: 'Iraq',
  ITA: 'Italia',
  JOR: 'Jordania',
  JPN: 'Japón',
  KOR: 'Corea del Sur',
  KSA: 'Arabia Saudita',
  MAR: 'Marruecos',
  MEX: 'México',
  NED: 'Países Bajos',
  NGA: 'Nigeria',
  NOR: 'Noruega',
  NZL: 'Nueva Zelanda',
  PAN: 'Panamá',
  PAR: 'Paraguay',
  PER: 'Perú',
  POL: 'Polonia',
  POR: 'Portugal',
  QAT: 'Catar',
  RSA: 'Sudáfrica',
  SCO: 'Escocia',
  SEN: 'Senegal',
  SRB: 'Serbia',
  SUI: 'Suiza',
  SWE: 'Suecia',
  TUN: 'Túnez',
  TUR: 'Turquía',
  URU: 'Uruguay',
  URY: 'Uruguay',
  USA: 'Estados Unidos',
  UZB: 'Uzbekistán',
  VEN: 'Venezuela',
  WAL: 'Gales',
}

/** Returns Spanish team name by TLA, falls back to the provided English name */
export function getTeamName(tla: string, fallback: string): string {
  return TEAM_NAMES_ES[tla] ?? fallback
}
