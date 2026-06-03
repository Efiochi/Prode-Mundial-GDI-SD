'use client'
import { useState } from 'react'

interface Props {
  displayName: string
  rank: number | null
  points: number
  exactos: number
  ganadores: number
  pctAciertos: number
}

export default function ShareCard({ displayName, rank, points, exactos, ganadores, pctAciertos }: Props) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const lines = [
      '🏆 GDI/SD Prode — Mundial 2026',
      `👤 ${displayName}${rank ? ` · Puesto #${rank}` : ''}`,
      `⭐ ${points} pts  ⚽ ${exactos} exactos  ✓ ${ganadores} ganadores  ${pctAciertos}% aciertos`,
    ]
    const text = lines.join('\n')

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'GDI/SD Prode', text })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // User cancelled share dialog — do nothing
    }
  }

  return (
    <div>
      {/* Card preview */}
      <div className="rounded-xl p-5 bg-gradient-to-br from-[#003049] to-[#1a5c8a] text-white mb-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#74ACDF] mb-2">
          GDI/SD Prode · Mundial 2026
        </div>
        <div className="font-heading font-bold text-xl text-white mb-0.5">{displayName}</div>
        {rank && (
          <div className="text-[#F6B40E] font-bold text-sm mb-3">Puesto #{rank}</div>
        )}
        <div className="flex gap-5 mt-3">
          <div className="text-center">
            <div className="font-heading font-bold text-3xl text-white">{points}</div>
            <div className="text-[10px] font-mono text-[#74ACDF] uppercase tracking-widest mt-0.5">pts</div>
          </div>
          <div className="text-center">
            <div className="font-heading font-bold text-3xl text-[#F6B40E]">{exactos}</div>
            <div className="text-[10px] font-mono text-[#74ACDF] uppercase tracking-widest mt-0.5">exactos</div>
          </div>
          <div className="text-center">
            <div className="font-heading font-bold text-3xl text-[#74ACDF]">{ganadores}</div>
            <div className="text-[10px] font-mono text-[#74ACDF] uppercase tracking-widest mt-0.5">ganadores</div>
          </div>
          {pctAciertos > 0 && (
            <div className="text-center">
              <div className="font-heading font-bold text-3xl text-white">{pctAciertos}%</div>
              <div className="text-[10px] font-mono text-[#74ACDF] uppercase tracking-widest mt-0.5">aciertos</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={share}
        className="w-full py-2.5 bg-[#236391] text-white text-sm font-bold rounded-xl hover:bg-[#1a4f73] transition-all active:scale-95"
      >
        {copied ? '✓ Copiado al portapapeles!' : '📤 Compartir resultado'}
      </button>
    </div>
  )
}
