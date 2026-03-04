import React, { useCallback, useState, useRef } from 'react'
import { Upload, Link2, Film, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface Props {
  onFile: (file: File) => void
  onUrl: (url: string) => void
  uploading: boolean
  uploadProgress: number
}

export function UploadZone({ onFile, onUrl, uploading, uploadProgress }: Props) {
  const [dragging, setDragging] = useState(false)
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      onFile(file)
    }
  }, [onFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  const handleUrlSubmit = () => {
    setUrlError('')
    if (!url.trim()) {
      setUrlError('Please enter a video URL')
      return
    }
    const isYouTube = /youtube\.com|youtu\.be/.test(url)
    if (!isYouTube && !url.startsWith('http')) {
      setUrlError('Please enter a valid YouTube or video URL')
      return
    }
    onUrl(url.trim())
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
        <button
          onClick={() => setTab('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            tab === 'upload'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
        <button
          onClick={() => setTab('url')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            tab === 'url'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <Link2 className="w-4 h-4" />
          YouTube / URL
        </button>
      </div>

      {tab === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer',
            dragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-zinc-700 hover:border-purple-500/60 hover:bg-zinc-900/80',
            uploading && 'cursor-default pointer-events-none'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto">
                <Film className="w-7 h-7 text-purple-400 animate-pulse" />
              </div>
              <p className="text-zinc-300 font-medium">Uploading video...</p>
              <div className="w-full max-w-xs mx-auto bg-zinc-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-zinc-500 text-sm">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-all',
                dragging ? 'bg-purple-500/30' : 'bg-zinc-800'
              )}>
                <Upload className={cn('w-7 h-7', dragging ? 'text-purple-400' : 'text-zinc-400')} />
              </div>
              <div>
                <p className="text-zinc-200 font-semibold text-lg">
                  {dragging ? 'Drop to upload' : 'Drop your video here'}
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  or click to browse — MP4, MOV, MKV up to 2GB
                </p>
              </div>
              <div className="flex items-center gap-3 justify-center text-xs text-zinc-600">
                <span>Podcasts</span>
                <span>·</span>
                <span>Webinars</span>
                <span>·</span>
                <span>Streams</span>
                <span>·</span>
                <span>Interviews</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Video URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://youtube.com/watch?v=... or direct video URL"
              className="input"
              disabled={uploading}
            />
            {urlError && (
              <p className="flex items-center gap-1.5 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {urlError}
              </p>
            )}
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={uploading || !url.trim()}
            className="btn-primary w-full justify-center"
          >
            {uploading ? 'Processing...' : 'Analyze Video'}
          </button>
          <p className="text-zinc-600 text-xs text-center">
            Supports YouTube, Vimeo, and direct MP4 links
          </p>
        </div>
      )}
    </div>
  )
}
