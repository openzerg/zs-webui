'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { createWebSocketClient, WebSocketClient } from '@/lib/websocket'
import { Agent, StatsSummary, AgentEvent } from '@/lib/types'
import { StatsCards } from '@/components/StatsCards'
import { AgentTable } from '@/components/AgentTable'
import { CreateAgentModal } from '@/components/CreateAgentModal'
import { GitTab } from '@/components/GitTab'
import { LlmApiTab } from '@/components/LlmApiTab'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, RefreshCw, LogOut, Server, GitBranch, Key } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type TabType = 'agents' | 'git' | 'llm'

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('agents')

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, statsRes] = await Promise.all([
        api.listAgents(),
        api.getStats(),
      ])
      if (agentsRes.success) {
        setAgents(agentsRes.data || [])
      }
      if (statsRes.success) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchData()

    const client = createWebSocketClient()
    if (client) {
      client.connect()
      client.subscribe((event: AgentEvent) => {
        console.log('Agent event:', event)
        fetchData()
      })
      setWsClient(client)
    }

    return () => {
      client?.disconnect()
    }
  }, [fetchData, isAuthenticated, authLoading, router])

  const handleCreateAgent = async (name: string) => {
    setIsCreating(true)
    try {
      const result = await api.createAgent({ name })
      if (result.success) {
        setIsModalOpen(false)
        fetchData()
      } else {
        alert(result.error || 'Failed to create agent')
      }
    } catch (error) {
      alert('Failed to create agent')
    } finally {
      setIsCreating(false)
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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'agents', label: 'Agents', icon: <Server className="w-4 h-4" /> },
    { id: 'git', label: 'Git', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'llm', label: 'LLM API', icon: <Key className="w-4 h-4" /> },
  ]

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">ZS Platform</h1>
            <p className="text-gray-400 mt-1">Agent Management Dashboard</p>
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
              <StatsCards stats={stats} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentTable
                  agents={agents}
                  onEnable={handleEnableAgent}
                  onDisable={handleDisableAgent}
                  onDelete={handleDeleteAgent}
                  onRefresh={fetchData}
                />
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'git' && <GitTab agents={agents} />}

        {activeTab === 'llm' && <LlmApiTab />}

        <CreateAgentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateAgent}
          isLoading={isCreating}
        />
      </div>
    </div>
  )
}