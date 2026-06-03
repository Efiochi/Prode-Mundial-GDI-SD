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
