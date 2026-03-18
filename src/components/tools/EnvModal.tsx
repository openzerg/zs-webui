'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'

interface EnvModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, value: string) => void
}

export function EnvModal({ isOpen, onClose, onSave }: EnvModalProps) {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const handleSave = () => {
    if (key && value) {
      onSave(key, value)
      setKey('')
      setValue('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add Environment Variable</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Key (e.g., API_KEY)"
            value={key}
            onChange={e => setKey(e.target.value)}
            className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
          />
          <textarea
            placeholder="Value"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-24"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}