import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Logo } from './components/Logo'
import { Home } from './pages/Home'
import { Github } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">
              AI Video Clipping
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors"
            >
              <Github className="w-4 h-4 text-zinc-400" />
            </a>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-4 text-center">
        <p className="text-zinc-600 text-xs">
          ClipEditor MVP · Powered by OpenAI Whisper + GPT-4 · FFmpeg
        </p>
      </footer>
    </div>
  )
}
