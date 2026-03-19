'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import SwarmApp from './SwarmApp'
import AgentApp from './AgentApp'

export default function Page() {
  const [mode, setMode] = useState<'swarm' | 'agent' | null>(null)

  useEffect(() => {
    setMode(api.mode)
  }, [])

  if (!mode) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return mode === 'swarm' ? <SwarmApp /> : <AgentApp />
}