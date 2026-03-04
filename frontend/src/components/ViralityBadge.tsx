import React from 'react'
import { TrendingUp, Flame } from 'lucide-react'
import { cn, getScoreLabel } from '../lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'md'
}

export function ViralityBadge({ score, size = 'md' }: Props) {
  const isHigh = score >= 75
  const isMid = score >= 50

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      isHigh ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
      isMid ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
      'bg-zinc-800 text-zinc-400 border border-zinc-700'
    )}>
      {isHigh ? <Flame className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
      <span>{score}</span>
      {size === 'md' && <span className="opacity-70">· {getScoreLabel(score)}</span>}
    </div>
  )
}
