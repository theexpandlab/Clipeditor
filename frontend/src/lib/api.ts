import axios from 'axios'
import type { Job, UploadResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
})

export async function uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadResponse>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data
}

export async function submitUrl(url: string): Promise<UploadResponse> {
  const { data } = await api.post<UploadResponse>('/submit-url', { url })
  return data
}

export async function getJob(jobId: string): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${jobId}`)
  return data
}

export function getClipUrl(jobId: string, clipId: string): string {
  return `/api/clips/${jobId}/${clipId}/video`
}

export function getThumbnailUrl(jobId: string, clipId: string): string {
  return `/api/clips/${jobId}/${clipId}/thumbnail`
}

export function getDownloadUrl(jobId: string, clipId: string): string {
  return `/api/clips/${jobId}/${clipId}/download`
}
