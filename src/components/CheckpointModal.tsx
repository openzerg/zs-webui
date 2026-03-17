'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Checkpoint } from '@/lib/types'
import { api } from '@/lib/api'
import { Clock, RotateCcw, Copy, Trash2 } from 'lucide-react'

interface CheckpointModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  onRefresh: () => void
}

export function CheckpointModal({ isOpen, onClose, agentName, onRefresh }: CheckpointModalProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [description, setDescription] = useState('')
  const [cloningCheckpoint, setCloningCheckpoint] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (isOpen && agentName) {
      loadCheckpoints()
    }
  }, [isOpen, agentName])

  const loadCheckpoints = async () => {
    setLoading(true)
    try {
      const response = await api.listCheckpoints(agentName)
      if (response.success && response.data) {
        setCheckpoints(response.data)
      }
    } catch (error) {
      console.error('Failed to load checkpoints:', error)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const response = await api.createCheckpoint(agentName, description || undefined)
      if (response.success) {
        setDescription('')
        loadCheckpoints()
        onRefresh()
      } else {
        alert(response.error || 'Failed to create checkpoint')
      }
    } catch (error) {
      console.error('Failed to create checkpoint:', error)
    }
    setCreating(false)
  }

  const handleRollback = async (checkpointId: string) => {
    if (!confirm('Rollback to this checkpoint? This will restore the agent\'s data and configuration.')) {
      return
    }
    try {
      const response = await api.rollbackAgent(agentName, checkpointId)
      if (response.success) {
        alert('Rollback successful. Please run "zerg-swarm apply" to rebuild the system.')
        onRefresh()
      } else {
        alert(response.error || 'Failed to rollback')
      }
    } catch (error) {
      console.error('Failed to rollback:', error)
    }
  }

  const handleDelete = async (checkpointId: string) => {
    if (!confirm('Delete this checkpoint?')) {
      return
    }
    try {
      const response = await api.deleteCheckpoint(checkpointId)
      if (response.success) {
        loadCheckpoints()
      } else {
        alert(response.error || 'Failed to delete checkpoint')
      }
    } catch (error) {
      console.error('Failed to delete checkpoint:', error)
    }
  }

  const handleClone = async (checkpointId: string) => {
    if (!newName) {
      alert('Please enter a new agent name')
      return
    }
    try {
      const response = await api.cloneCheckpoint(checkpointId, newName)
      if (response.success) {
        setCloningCheckpoint(null)
        setNewName('')
        onRefresh()
        alert(`Agent "${newName}" created from checkpoint`)
      } else {
        alert(response.error || 'Failed to clone checkpoint')
      }
    } catch (error) {
      console.error('Failed to clone checkpoint:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Checkpoints: ${agentName}`}>
      <div className="space-y-4">
        {/* Create checkpoint */}
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
          />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Checkpoint'}
          </Button>
        </div>

        {/* Checkpoint list */}
        {loading ? (
          <div className="text-center py-4 text-gray-400">Loading...</div>
        ) : checkpoints.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No checkpoints yet</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="p-3 bg-dark-lighter rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{formatDate(cp.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRollback(cp.id)}
                      className="!px-2 !py-1"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Rollback
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCloningCheckpoint(cloningCheckpoint === cp.id ? null : cp.id)}
                      className="!px-2 !py-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Clone
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(cp.id)}
                      className="!p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {cp.description && (
                  <p className="text-sm text-gray-400 mt-1">{cp.description}</p>
                )}
                {cloningCheckpoint === cp.id && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="New agent name"
                      pattern="[a-z0-9-]+"
                      className="flex-1 px-3 py-1 text-sm bg-dark border border-gray-700 rounded focus:outline-none focus:border-primary"
                    />
                    <Button size="sm" onClick={() => handleClone(cp.id)}>
                      Clone
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setCloningCheckpoint(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}