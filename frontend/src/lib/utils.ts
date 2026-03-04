import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getScoreClass(score: number): string {
  if (score >= 75) return 'score-high'
  if (score >= 50) return 'score-medium'
  return 'score-low'
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Viral Potential'
  if (score >= 70) return 'High Engagement'
  if (score >= 55) return 'Good Content'
  if (score >= 40) return 'Decent'
  return 'Low Engagement'
}
