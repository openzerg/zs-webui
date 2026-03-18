'use client'

import { Button } from '@/components/Button'
import { Users, Trash2 } from 'lucide-react'

interface AuthorizedAgentsSectionProps {
  allowedAgents: string[]
  authorAgent: string
  onAdd: () => void
  onRevoke: (agentName: string) => void
}

export function AuthorizedAgentsSection({ 
  allowedAgents, 
  authorAgent, 
  onAdd, 
  onRevoke 
}: AuthorizedAgentsSectionProps) {
  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Authorized Agents</h4>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Users className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allowedAgents.map(agent => (
          <div key={agent} className="flex items-center gap-1 bg-dark-light px-2 py-1 rounded text-sm">
            <span>{agent}</span>
            {agent !== authorAgent && (
              <button onClick={() => onRevoke(agent)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}