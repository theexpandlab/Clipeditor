import React, { useState, useRef } from 'react'
import { Play, Pause, Download, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDuration, formatTimestamp } from '../lib/utils'
import { getClipUrl, getDownloadUrl } from '../lib/api'
import { ViralityBadge } from './ViralityBadge'
import type { Clip } from '../types'

interface Props {
  clip: Clip
  jobId: string
  rank: number
}

export function ClipCard({ clip, jobId, rank }: Props) {
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  if (clip.status === 'processing' || clip.status === 'pending') {
    return (
      <div className="clip-card p-4 flex items-center gap-4">
        <div className="w-24 h-16 bg-zinc-800 rounded-lg shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800 rounded shimmer w-3/4" />
          <div className="h-3 bg-zinc-800 rounded shimmer w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="clip-card overflow-hidden" onClick={() => setExpanded(!expanded)}>
      <div className="p-4 flex items-start gap-4">
        {/* Rank badge */}
        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0 mt-0.5">
          #{rank}
        </div>

        {/* Video thumbnail / player */}
        <div className="relative w-28 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800 group">
          {clip.status === 'ready' ? (
            <>
              <video
                ref={videoRef}
                src={getClipUrl(jobId, clip.id)}
                className="w-full h-full object-cover rounded-lg"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onClick={togglePlay}
                playsInline
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {playing
                  ? <Pause className="w-5 h-5 text-white drop-shadow-lg" />
                  : <Play className="w-5 h-5 text-white drop-shadow-lg fill-white" />
                }
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              {clip.status === 'failed' ? 'Failed' : 'Processing...'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-1.5">
            {clip.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <ViralityBadge score={clip.virality_score} size="sm" />
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              {formatDuration(clip.duration)}
            </span>
            <span className="text-xs text-zinc-600">
              {formatTimestamp(clip.start_time)} → {formatTimestamp(clip.end_time)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {clip.status === 'ready' && (
            <a
              href={getDownloadUrl(jobId, clip.id)}
              download
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              title="Download clip"
            >
              <Download className="w-4 h-4 text-zinc-300" />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-zinc-300" /> : <ChevronDown className="w-4 h-4 text-zinc-300" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Hook</p>
            <p className="text-sm text-purple-300 font-medium">"{clip.hook}"</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Transcript excerpt</p>
            <p className="text-sm text-zinc-400 leading-relaxed">"{clip.transcript_excerpt}"</p>
          </div>
          {clip.status === 'ready' && (
            <a
              href={getDownloadUrl(jobId, clip.id)}
              download
              onClick={(e) => e.stopPropagation()}
              className="btn-primary text-sm mt-2"
            >
              <Download className="w-4 h-4" />
              Download Clip
            </a>
          )}
        </div>
      )}
    </div>
  )
}
