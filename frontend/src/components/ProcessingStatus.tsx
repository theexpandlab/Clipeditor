import React from 'react'
import { Wand2, FileText, Scissors, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Job } from '../types'

interface Props {
  job: Job
}

const STEPS = [
  { key: 'transcribing', icon: FileText, label: 'Transcribing audio', desc: 'Converting speech to text with AI' },
  { key: 'analyzing', icon: Wand2, label: 'Analyzing content', desc: 'Finding your most engaging moments' },
  { key: 'clipping', icon: Scissors, label: 'Creating clips', desc: 'Extracting and processing video clips' },
  { key: 'done', icon: CheckCircle2, label: 'Complete', desc: 'Your clips are ready!' },
] as const

type StepKey = typeof STEPS[number]['key']

const STATUS_ORDER: Array<Job['status']> = ['uploading', 'transcribing', 'analyzing', 'clipping', 'done']

function getStepState(stepKey: StepKey, currentStatus: Job['status']): 'done' | 'active' | 'pending' {
  const stepIdx = STATUS_ORDER.indexOf(stepKey as Job['status'])
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  if (currentIdx > stepIdx) return 'done'
  if (currentIdx === stepIdx) return 'active'
  return 'pending'
}

export function ProcessingStatus({ job }: Props) {
  if (job.status === 'failed') {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">Processing failed</h3>
          <p className="text-zinc-400 text-sm mt-1">{job.error || 'Something went wrong. Please try again.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-8 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="font-bold text-white text-xl">AI is working on your video</h3>
        <p className="text-zinc-400 text-sm">{job.message}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Progress</span>
          <span>{job.progress}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map(({ key, icon: Icon, label, desc }) => {
          const state = getStepState(key, job.status)
          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all',
                state === 'active' && 'bg-purple-500/10 border border-purple-500/20',
                state === 'done' && 'opacity-60',
                state === 'pending' && 'opacity-30'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                state === 'done' && 'bg-emerald-500/20',
                state === 'active' && 'bg-purple-500/20',
                state === 'pending' && 'bg-zinc-800'
              )}>
                {state === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : state === 'active' ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  state === 'done' ? 'text-zinc-300' : state === 'active' ? 'text-white' : 'text-zinc-500'
                )}>
                  {label}
                </p>
                {state === 'active' && (
                  <p className="text-xs text-zinc-400">{desc}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
