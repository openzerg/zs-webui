'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'

interface InvokeModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoke: (input: Record<string, unknown>) => void
}

export function InvokeModal({ isOpen, onClose, onInvoke }: InvokeModalProps) {
  const [input, setInput] = useState('{}')
  const [result, setResult] = useState<string | null>(null)

  const handleInvoke = () => {
    try {
      const inputJson = JSON.parse(input)
      onInvoke(inputJson)
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">JSON Input</label>
            <textarea
              placeholder='{"query": "search query", "max_results": 5}'
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-32 font-mono text-sm"
            />
          </div>
          {result && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Result</label>
              <pre className="bg-dark-light border border-gray-700 rounded p-3 text-sm overflow-auto max-h-48">
                {result}
              </pre>
            </div>
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