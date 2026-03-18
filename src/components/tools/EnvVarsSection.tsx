'use client'

import { Button } from '@/components/Button'
import { Key, Trash2 } from 'lucide-react'

interface EnvVarsSectionProps {
  envVars: string[]
  onAdd: () => void
  onDelete: (key: string) => void
}

export function EnvVarsSection({ envVars, onAdd, onDelete }: EnvVarsSectionProps) {
  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Environment Variables</h4>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Key className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      {envVars.length === 0 ? (
        <p className="text-gray-500 text-sm">No env vars</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {envVars.map(key => (
            <div key={key} className="flex items-center gap-1 bg-dark-light px-2 py-1 rounded text-sm">
              <span>{key}</span>
              <button onClick={() => onDelete(key)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}