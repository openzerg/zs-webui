'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
  isLoading?: boolean
}

export function CreateAgentModal({ isOpen, onClose, onCreate, isLoading }: CreateAgentModalProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      onCreate(name)
      setName('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Agent">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
              placeholder="my-agent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !name}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}