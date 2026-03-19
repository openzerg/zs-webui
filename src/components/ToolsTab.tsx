'use client'

import { useState, useEffect } from 'react'
import { Tool, Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, Trash2, Play, RefreshCw } from 'lucide-react'
import { CreateToolModal } from '@/components/CreateToolModal'
import { EnvVarsSection, AuthorizedAgentsSection, EnvModal, AuthModal, InvokeModal } from '@/components/tools'

interface ToolsTabProps {
  agents: Agent[]
}

export function ToolsTab({ agents }: ToolsTabProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [envVars, setEnvVars] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEnvModal, setShowEnvModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showInvokeModal, setShowInvokeModal] = useState(false)

  useEffect(() => { loadTools() }, [])

  const loadTools = async () => {
    setIsLoading(true)
    try {
      const res = await api.listTools()
      if (res.success && res.data) setTools(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const loadEnvVars = async (slug: string) => {
    try {
      const res = await api.listToolEnv(slug)
      if (res.success && res.data) setEnvVars(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool)
    loadEnvVars(tool.slug)
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this tool?')) return
    await api.deleteTool(slug)
    setSelectedTool(null)
    loadTools()
  }

  const handlePull = async (slug: string) => {
    const res = await api.pullTool(slug)
    if (res.success) {
      loadTools()
      if (selectedTool?.slug === slug && res.data) {
        setSelectedTool(res.data)
      }
    } else {
      alert(res.error || 'Failed to pull tool')
    }
  }

  const handleSetEnv = async (key: string, value: string) => {
    if (!selectedTool) return
    await api.setToolEnv(selectedTool.slug, key, value)
    loadEnvVars(selectedTool.slug)
  }

  const handleDeleteEnv = async (key: string) => {
    if (!selectedTool) return
    if (!confirm(`Delete env var "${key}"?`)) return
    await api.deleteToolEnv(selectedTool.slug, key)
    loadEnvVars(selectedTool.slug)
  }

  const handleAuthorize = async (agentName: string) => {
    if (!selectedTool) return
    await api.authorizeTool(selectedTool.slug, agentName)
    loadTools()
  }

  const handleRevoke = async (agentName: string) => {
    if (!selectedTool) return
    await api.revokeTool(selectedTool.slug, agentName)
    loadTools()
    const updated = tools.find(t => t.slug === selectedTool.slug)
    if (updated) setSelectedTool(updated)
  }

  const handleInvoke = async (input: Record<string, unknown>) => {
    if (!selectedTool) return
    const res = await api.invokeTool(selectedTool.slug, { input })
    if (res.success) {
      alert('Tool executed successfully!')
    } else {
      alert(`Error: ${res.error}`)
    }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tools</CardTitle>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Clone
          </Button>
        </CardHeader>
        <CardContent>
          {tools.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No tools yet</p>
          ) : (
            <div className="space-y-2">
              {tools.map(tool => (
                <div
                  key={tool.slug}
                  onClick={() => handleSelectTool(tool)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedTool?.slug === tool.slug
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-dark-light hover:bg-dark-lighter border border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tool.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      tool.enabled ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {tool.enabled ? 'enabled' : 'disabled'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {tool.forgejo_repo} ({tool.git_commit.slice(0, 8)})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {selectedTool ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedTool.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handlePull(selectedTool.slug)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(selectedTool.slug)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400">Slug:</span>{' '}
                  <span className="font-mono">{selectedTool.slug}</span>
                </div>
                <div>
                  <span className="text-gray-400">Version:</span>{' '}
                  <span className="font-mono">{selectedTool.version}</span>
                </div>
                <div>
                  <span className="text-gray-400">Repo:</span>{' '}
                  <span className="font-mono">{selectedTool.forgejo_repo}</span>
                </div>
                <div>
                  <span className="text-gray-400">Entrypoint:</span>{' '}
                  <span className="font-mono">{selectedTool.entrypoint}</span>
                </div>

                <EnvVarsSection
                  envVars={envVars}
                  onAdd={() => setShowEnvModal(true)}
                  onDelete={handleDeleteEnv}
                />

                <AuthorizedAgentsSection
                  allowedAgents={selectedTool.allowed_agents}
                  authorAgent={selectedTool.author_agent}
                  onAdd={() => setShowAuthModal(true)}
                  onRevoke={handleRevoke}
                />

                <div className="border-t border-gray-700 pt-4">
                  <Button onClick={() => setShowInvokeModal(true)}>
                    <Play className="w-4 h-4 mr-1" /> Invoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <p className="text-gray-400 text-center py-8">Select a tool to view details</p>
          </CardContent>
        )}
      </Card>

      <EnvModal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        onSave={handleSetEnv}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        agents={agents}
        excludedAgents={selectedTool?.allowed_agents || []}
        onAuthorize={handleAuthorize}
      />

      <InvokeModal
        isOpen={showInvokeModal}
        onClose={() => setShowInvokeModal(false)}
        onInvoke={handleInvoke}
      />

      <CreateToolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        agents={agents}
        onCreated={loadTools}
      />
    </div>
  )
}