'use client'

import { useState, useEffect } from 'react'
import { Provider, Model } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { LlmProvidersTab } from '@/components/LlmProvidersTab'
import { LlmModelsTab } from '@/components/LlmModelsTab'

export function LlmApiTab() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [providersRes, modelsRes] = await Promise.all([
        api.listProviders(),
        api.listModels()
      ])
      if (providersRes.success && providersRes.data) setProviders(providersRes.data)
      if (modelsRes.success && modelsRes.data) setModels(modelsRes.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LlmProvidersTab onProvidersChange={loadData} />
      <LlmModelsTab providers={providers} onModelsChange={loadData} />
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>LLM Proxy Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-2">Bind a model to an agent, then use the agent's internal token:</p>
          <code className="block bg-dark-light border border-gray-700 rounded px-4 py-3 text-primary font-mono">
            {typeof window !== 'undefined' ? window.location.hostname : ''}:17534/v1/chat/completions
          </code>
          <p className="text-gray-500 text-sm mt-2">Authorization: Bearer {'{agent-internal-token}'}</p>
          <p className="text-gray-500 text-sm mt-1">The model parameter in requests will be replaced with the bound model's real name.</p>
        </CardContent>
      </Card>
    </div>
  )
}