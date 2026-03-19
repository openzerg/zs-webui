'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from './Button'
import { Card } from './Card'

interface ToolExecutorProps {
  agentName?: string
  sessionId?: string
}

interface Tool {
  name: string
  description: string
  parameters: {
    type?: string
    properties?: Record<string, {
      type?: string
      description?: string
      [key: string]: unknown
    }>
    required?: string[]
  }
}

export default function ToolExecutor({ agentName, sessionId }: ToolExecutorProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [args, setArgs] = useState<Record<string, unknown>>({})
  const [result, setResult] = useState<{ title: string; output: string; truncated: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTools()
  }, [agentName])

  const loadTools = async () => {
    const response = await api.listBuiltinTools(agentName)
    if (response.success && response.data) {
      setTools(response.data.tools as Tool[])
    }
  }

  const executeTool = async () => {
    if (!selectedTool) return
    
    setLoading(true)
    setError(null)
    setResult(null)

    const response = await api.executeBuiltinTool(agentName, selectedTool.name, args, sessionId)
    
    setLoading(false)
    
    if (response.success && response.data) {
      setResult(response.data)
    } else {
      setError(response.error || 'Execution failed')
    }
  }

  const renderParameterInput = (name: string, schema: { type?: string; description?: string }) => {
    const type = schema.type || 'string'
    const value = args[name] ?? (type === 'boolean' ? false : type === 'number' ? 0 : '')

    switch (type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => setArgs({ ...args, [name]: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-400">{schema.description}</span>
          </label>
        )
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => setArgs({ ...args, [name]: parseFloat(e.target.value) || 0 })}
            placeholder={schema.description}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => setArgs({ ...args, [name]: e.target.value })}
            placeholder={schema.description}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
        )
    }
  }

  const properties = selectedTool?.parameters?.properties || {}
  const required = selectedTool?.parameters?.required || []

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Builtin Tools</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => {
              setSelectedTool(tool)
              setArgs({})
              setResult(null)
              setError(null)
            }}
            className={`px-3 py-2 text-sm rounded border transition-colors ${
              selectedTool?.name === tool.name
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tool.name}
          </button>
        ))}
      </div>

      {selectedTool && (
        <Card className="p-4">
          <h4 className="text-md font-medium text-white mb-2">{selectedTool.name}</h4>
          <p className="text-sm text-gray-400 mb-4">{selectedTool.description}</p>
          
          {Object.keys(properties).length > 0 && (
            <div className="space-y-3 mb-4">
              {Object.entries(properties).map(([name, schema]) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {name}
                    {required.includes(name) && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>
                  {renderParameterInput(name, schema as { type?: string; description?: string })}
                </div>
              ))}
            </div>
          )}

          <Button onClick={executeTool} disabled={loading}>
            {loading ? 'Executing...' : 'Execute'}
          </Button>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-900/20 border-red-800">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {result && (
        <Card className="p-4">
          <h4 className="text-md font-medium text-white mb-2">{result.title}</h4>
          {result.truncated && (
            <p className="text-xs text-yellow-400 mb-2">Output was truncated</p>
          )}
          <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96 bg-gray-900 p-3 rounded">
            {result.output}
          </pre>
        </Card>
      )}
    </div>
  )
}