'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Agent } from '@/lib/types'

interface InvokeModalProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  allowedAgents: string[]
  onInvoke: (callerAgent: string, input: Record<string, unknown>) => void
}

export function InvokeModal({ isOpen, onClose, agents, allowedAgents, onInvoke }: InvokeModalProps) {
  const [caller, setCaller] = useState('')
  const [input, setInput] = useState('{}')
  const [result, setResult] = useState<string | null>(null)
  
  const availableAgents = agents.filter(a => allowedAgents.includes(a.name))

  const handleInvoke = () => {
    if (!caller) return
    try {
      const inputJson = JSON.parse(input)
      onInvoke(caller, inputJson)
    } catch (e) {
      setResult(`Error: ${e}`)
    }
  }

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-bold mb-4">Invoke Tool</h3>
        <div className="space-y-4">
          <select
            value={caller}
            onChange={e => setCaller(e.target.value)}
            className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="">Select caller agent</option>
            {availableAgents.map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          <textarea
            placeholder='JSON input (e.g., {"query": "hello"})'
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-24 font-mono text-sm"
          />
          {result && (
            <pre className="bg-dark-light border border-gray-700 rounded p-3 text-sm overflow-auto max-h-48">
              {result}
            </pre>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button onClick={handleInvoke}>Invoke</Button>
        </div>
      </div>
    </div>
  )
}