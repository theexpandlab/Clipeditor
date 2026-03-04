import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Zap, MessageSquare, Repeat2 } from 'lucide-react'
import { UploadZone } from '../components/UploadZone'
import { ProcessingStatus } from '../components/ProcessingStatus'
import { ClipGrid } from '../components/ClipGrid'
import { uploadVideo, submitUrl, getJob } from '../lib/api'
import type { Job } from '../types'

const POLL_INTERVAL = 2500

export function Home() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await getJob(id)
        setJob(data)
        if (data.status === 'done' || data.status === 'failed') {
          clearInterval(pollRef.current!)
          pollRef.current = null
        }
      } catch {
        // silently retry
      }
    }, POLL_INTERVAL)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    setUploadProgress(0)
    try {
      const { job_id } = await uploadVideo(file, setUploadProgress)
      setJobId(job_id)
      const initial = await getJob(job_id)
      setJob(initial)
      startPolling(job_id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleUrl = async (url: string) => {
    setError(null)
    setUploading(true)
    try {
      const { job_id } = await submitUrl(url)
      setJobId(job_id)
      const initial = await getJob(job_id)
      setJob(initial)
      startPolling(job_id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to process URL. Please try again.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setJobId(null)
    setJob(null)
    setError(null)
    setUploading(false)
    setUploadProgress(0)
  }

  const isProcessing = job && job.status !== 'done' && job.status !== 'failed'
  const isDone = job?.status === 'done'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      {!jobId && (
        <section className="pt-20 pb-12 px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered video clipping
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Turn long videos into<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              viral short clips
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Upload any long-form video. Our AI finds the best moments, adds captions,
            and creates ready-to-post short clips in minutes.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            {[
              { icon: Zap, label: 'AI Clip Detection' },
              { icon: MessageSquare, label: 'Auto Captions' },
              { icon: Repeat2, label: 'Auto Reframe' },
              { icon: Sparkles, label: 'Virality Score' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400">
                <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {!jobId && (
            <UploadZone
              onFile={handleFile}
              onUrl={handleUrl}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />
          )}

          {job && isProcessing && (
            <div className="space-y-4">
              <ProcessingStatus job={job} />
            </div>
          )}

          {job && isDone && job.clips.length > 0 && jobId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your clips are ready!</h2>
                <button onClick={handleReset} className="btn-secondary text-sm">
                  New Video
                </button>
              </div>
              <ClipGrid clips={job.clips} jobId={jobId} />
            </div>
          )}

          {job?.status === 'failed' && (
            <div className="space-y-4">
              <ProcessingStatus job={job} />
              <button onClick={handleReset} className="btn-secondary w-full justify-center">
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
