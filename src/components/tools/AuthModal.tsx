'use client'

import { Button } from '@/components/Button'
import { Agent } from '@/lib/types'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  excludedAgents: string[]
  onAuthorize: (agentName: string) => void
}

export function AuthModal({ isOpen, onClose, agents, excludedAgents, onAuthorize }: AuthModalProps) {
  const availableAgents = agents.filter(a => !excludedAgents.includes(a.name))
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Authorize Agent</h3>
        <select
          className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
          onChange={e => {
            if (e.target.value) {
              onAuthorize(e.target.value)
              onClose()
            }
          }}
          defaultValue=""
        >
          <option value="">Select agent</option>
          {availableAgents.map(a => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}