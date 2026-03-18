'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'

interface CreateSkillModalProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  onCreated: () => void
}

export function CreateSkillModal({ isOpen, onClose, agents, onCreated }: CreateSkillModalProps) {
  const [name, setName] = useState('')
  const [skillType, setSkillType] = useState('host_script')
  const [ownerAgent, setOwnerAgent] = useState('')
  const [entrypoint, setEntrypoint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !ownerAgent || !entrypoint) {
      setError('Please fill all required fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await api.createSkill({
        name,
        skill_type: skillType,
        owner_agent: ownerAgent,
        entrypoint,
      })

      if (res.success) {
        setName('')
        setSkillType('host_script')
        setOwnerAgent('')
        setEntrypoint('')
        onCreated()
        onClose()
      } else {
        setError(res.error || 'Failed to create skill')
      }
    } catch (e) {
      setError('Failed to create skill')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Create Skill</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-skill"
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Type *</label>
            <select
              value={skillType}
              onChange={e => setSkillType(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="host_script">Host Script (runs on host)</option>
              <option value="agent_script">Agent Script (runs in container)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Owner Agent *</label>
            <select
              value={ownerAgent}
              onChange={e => setOwnerAgent(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="">Select agent</option>
              {agents.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Entrypoint *</label>
            <input
              type="text"
              value={entrypoint}
              onChange={e => setEntrypoint(e.target.value)}
              placeholder="python script.py"
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white font-mono"
            />
            <p className="text-gray-500 text-xs mt-1">Command to run the skill</p>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}