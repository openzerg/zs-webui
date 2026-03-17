'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types'
import { Button } from './Button'
import { CheckpointModal } from './CheckpointModal'
import { Power, Trash2, ExternalLink, Clock } from 'lucide-react'

interface AgentTableProps {
  agents: Agent[]
  onEnable: (name: string) => void
  onDisable: (name: string) => void
  onDelete: (name: string) => void
  onRefresh: () => void
}

export function AgentTable({ agents, onEnable, onDisable, onDelete, onRefresh }: AgentTableProps) {
  const [checkpointAgent, setCheckpointAgent] = useState<string | null>(null)

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No agents yet. Create one to get started.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-primary font-medium">Name</th>
              <th className="text-left py-3 px-4 text-primary font-medium">Status</th>
              <th className="text-left py-3 px-4 text-primary font-medium">IP</th>
              <th className="text-right py-3 px-4 text-primary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.name} className="border-b border-gray-800 hover:bg-dark-lighter/50">
                <td className="py-3 px-4 font-medium">{agent.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        agent.enabled ? 'bg-primary/20 text-primary' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {agent.enabled ? 'enabled' : 'disabled'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        agent.online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {agent.online ? 'online' : 'offline'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-sm">{agent.container_ip}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCheckpointAgent(agent.name)}
                      className="!p-2"
                      title="Checkpoints"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={agent.enabled ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => (agent.enabled ? onDisable(agent.name) : onEnable(agent.name))}
                      className="!p-2"
                      title={agent.enabled ? 'Disable' : 'Enable'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    {agent.online && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="!p-2"
                        onClick={() => window.open(`http://${agent.container_ip}:8080`, '_blank')}
                        title="Open workspace"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(agent.name)}
                      className="!p-2"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {checkpointAgent && (
        <CheckpointModal
          isOpen={true}
          onClose={() => setCheckpointAgent(null)}
          agentName={checkpointAgent}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}