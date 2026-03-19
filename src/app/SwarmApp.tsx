'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Agent, Session, Message, Process, Activity, Task, FileInfo, FileContent, FileResponse } from '@/lib/types'
import { StatsCards } from '@/components/StatsCards'
import { Button } from '@/components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { CreateAgentModal } from '@/components/CreateAgentModal'
import { CheckpointModal } from '@/components/CheckpointModal'
import { AgentDetailModal } from '@/components/AgentDetailModal'
import { ToolsTab } from '@/components/ToolsTab'
import { SkillsTab } from '@/components/SkillsTab'
import { GitTab } from '@/components/GitTab'
import { LlmApiTab } from '@/components/LlmApiTab'
import { Plus, RefreshCw, LogOut, Server, GitBranch, Key, BookOpen, Wrench, LogIn } from 'lucide-react'

type TabType = 'agents' | 'skills' | 'tools' | 'git' | 'llm'

interface Stats {
  total_agents: number
  enabled_agents: number
  online_agents: number
}

export default function SwarmApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('agents')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkpointAgent, setCheckpointAgent] = useState<string | null>(null)
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null)
  const [version, setVersion] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [loginToken, setLoginToken] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    if (api.isAuthenticated()) {
      await fetchData()
    }
    setIsLoading(false)
  }

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, statsRes, healthRes] = await Promise.all([
        api.listAgents(),
        api.getStats(),
        api.checkHealth(),
      ])
      if (agentsRes.success && agentsRes.data) {
        setAgents(agentsRes.data as Agent[])
        setIsAuthenticated(true)
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data as Stats)
      }
      if (healthRes.version) {
        setVersion(healthRes.version)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setIsAuthenticated(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const success = await api.login(loginToken)
    if (success) {
      setIsAuthenticated(true)
      setShowLogin(false)
      setLoginToken('')
      fetchData()
    } else {
      setLoginError('Invalid token')
    }
  }

  const handleLogout = () => {
    api.logout()
    setIsAuthenticated(false)
    setAgents([])
    setStats(null)
  }

  const handleCreateAgent = async (name: string) => {
    const result = await api.createAgent(name)
    if (result.success) {
      setIsModalOpen(false)
      fetchData()
    } else {
      alert(result.error || 'Failed to create agent')
    }
  }

  const handleEnableAgent = async (name: string) => {
    await api.enableAgent(name)
    fetchData()
  }

  const handleDisableAgent = async (name: string) => {
    await api.disableAgent(name)
    fetchData()
  }

  const handleDeleteAgent = async (name: string) => {
    if (confirm(`Delete agent "${name}"?`)) {
      await api.deleteAgent(name)
      fetchData()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || showLogin) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Server className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Zerg Swarm</h1>
            </div>
            <p className="text-gray-400 mt-2">Sign in with admin token</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Admin Token</label>
                  <input
                    type="password"
                    value={loginToken}
                    onChange={(e) => setLoginToken(e.target.value)}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-gray-100"
                    placeholder="Enter admin token"
                    required
                    autoFocus
                  />
                </div>

                {loginError && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {loginError}
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'agents', label: 'Agents', icon: <Server className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
    { id: 'git', label: 'Git', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'llm', label: 'LLM API', icon: <Key className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-dark text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Zerg Swarm</h1>
            <p className="text-gray-400 mt-1">Agent Management Dashboard {version && <span className="text-primary">v{version}</span>}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {activeTab === 'agents' && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            )}
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t transition ${
                activeTab === tab.id
                  ? 'bg-dark-light text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'agents' && (
          <>
            <div className="mb-8">
              <StatsCards stats={stats ? { total_agents: stats.total_agents, enabled_agents: stats.enabled_agents, online_agents: stats.online_agents, total_input_tokens: 0, total_output_tokens: 0, total_cost: 0 } : null} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Agents</CardTitle>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No agents yet. Create one to get started.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-primary font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-primary font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-primary font-medium">IP</th>
                        <th className="text-right py-3 px-4 text-primary font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.name} className="border-b border-gray-800 hover:bg-dark-lighter/50">
                          <td className="py-3 px-4 font-medium">{agent.name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${agent.enabled ? 'bg-primary/20 text-primary' : 'bg-gray-600 text-gray-300'}`}>
                                {agent.enabled ? 'enabled' : 'disabled'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${agent.online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {agent.online ? 'online' : 'offline'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">{agent.container_ip}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setDetailAgent(agent)} className="!p-2" title="Details">
                                <Server className="w-4 h-4" />
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => setCheckpointAgent(agent.name)} className="!p-2" title="Checkpoints">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button variant={agent.enabled ? 'secondary' : 'primary'} size="sm" onClick={() => agent.enabled ? handleDisableAgent(agent.name) : handleEnableAgent(agent.name)} className="!p-2" title={agent.enabled ? 'Disable' : 'Enable'}>
                                <Server className="w-4 h-4" />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteAgent(agent.name)} className="!p-2" title="Delete">
                                <LogOut className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'skills' && <SkillsTab agents={agents} />}
        {activeTab === 'tools' && <ToolsTab agents={agents} />}
        {activeTab === 'git' && <GitTab agents={agents} />}
        {activeTab === 'llm' && <LlmApiTab />}

        <CreateAgentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateAgent} isLoading={false} />
        
        {checkpointAgent && (
          <CheckpointModal isOpen={true} onClose={() => setCheckpointAgent(null)} agentName={checkpointAgent} onRefresh={fetchData} />
        )}
        
        {detailAgent && (
          <AgentDetailModal isOpen={true} onClose={() => setDetailAgent(null)} agent={detailAgent} />
        )}
      </div>
    </div>
  )
}