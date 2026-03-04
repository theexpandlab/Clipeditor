import React from 'react'
import { Scissors } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
        <Scissors className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold text-white tracking-tight">
        Clip<span className="text-purple-400">Editor</span>
      </span>
    </div>
  )
}
