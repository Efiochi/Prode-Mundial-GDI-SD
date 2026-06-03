'use client'
import { useEffect, useState } from 'react'
import { parseISO, differenceInSeconds, subHours } from 'date-fns'

export default function Countdown({ matchDate }: { matchDate: string }) {
  const [secs, setSecs] = useState<number | null>(null)

  useEffect(() => {
    const cutoff = subHours(parseISO(matchDate), 1)
    const update = () => {
      const remaining = differenceInSeconds(cutoff, new Date())
      setSecs(remaining > 0 ? remaining : 0)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [matchDate])

  if (secs === null || secs <= 0) return null
  // Only show within 48h of cutoff
  if (secs > 48 * 3600) return null

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60

  if (h >= 24) {
    return <span className="text-[10px] font-mono text-[#74ACDF]">cierra en {Math.floor(h / 24)}d</span>
  }
  if (h > 0) {
    return <span className="text-[10px] font-mono font-bold text-[#F6B40E]">⏱ {h}h {m}m</span>
  }
  return (
    <span className="text-[10px] font-mono font-bold text-red-500 animate-pulse">
      ⏱ {m}:{String(s).padStart(2, '0')}
    </span>
  )
}
