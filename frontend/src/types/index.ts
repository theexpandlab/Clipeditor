export interface Clip {
  id: string
  title: string
  start_time: number
  end_time: number
  duration: number
  virality_score: number
  hook: string
  transcript_excerpt: string
  file_path?: string
  thumbnail_path?: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
}

export interface Job {
  job_id: string
  status: 'uploading' | 'transcribing' | 'analyzing' | 'clipping' | 'done' | 'failed'
  progress: number
  message: string
  clips: Clip[]
  video_duration?: number
  error?: string
}

export type ProcessingStatus = Job['status']

export interface UploadResponse {
  job_id: string
  message: string
}
