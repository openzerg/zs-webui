'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Button } from '@/components/Button'

interface CreateToolModalProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  onCreated: () => void
}

export function CreateToolModal({ isOpen, onClose, agents, onCreated }: CreateToolModalProps) {
  const [slug, setSlug] = useState('')
  const [forgejoRepo, setForgejoRepo] = useState('')
  const [authorAgent, setAuthorAgent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!slug || !forgejoRepo || !authorAgent) {
      setError('All fields are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await api.createTool({
        slug,
        forgejo_repo: forgejoRepo,
        author_agent: authorAgent,
      })

      if (res.success) {
        setSlug('')
        setForgejoRepo('')
        setAuthorAgent('')
        onCreated()
        onClose()
      } else {
        setError(res.error || 'Failed to create tool')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Clone Tool from Forgejo</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug</label>
            <input
              type="text"
              placeholder="e.g., brave-search"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Forgejo Repository</label>
            <input
              type="text"
              placeholder="e.g., tools/brave-search"
              value={forgejoRepo}
              onChange={e => setForgejoRepo(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Author Agent</label>
            <select
              value={authorAgent}
              onChange={e => setAuthorAgent(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="">Select agent</option>
              {agents.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Cloning...' : 'Clone'}
          </Button>
        </div>
      </div>
    </div>
  )
}