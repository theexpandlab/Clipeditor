import React from 'react'
import { Scissors, TrendingUp } from 'lucide-react'
import { ClipCard } from './ClipCard'
import type { Clip } from '../types'

interface Props {
  clips: Clip[]
  jobId: string
}

export function ClipGrid({ clips, jobId }: Props) {
  const sorted = [...clips].sort((a, b) => b.virality_score - a.virality_score)
  const avgScore = clips.length
    ? Math.round(clips.reduce((sum, c) => sum + c.virality_score, 0) / clips.length)
    : 0

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{clips.length}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Clips Generated</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{avgScore}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Virality Score</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {clips.filter(c => c.virality_score >= 75).length}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">High Potential</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-white">Your Clips</h2>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {clips.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <TrendingUp className="w-3.5 h-3.5" />
          Sorted by virality
        </div>
      </div>

      {/* Clips list */}
      <div className="space-y-3">
        {sorted.map((clip, i) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            jobId={jobId}
            rank={i + 1}
          />
        ))}
      </div>
    </div>
  )
}
