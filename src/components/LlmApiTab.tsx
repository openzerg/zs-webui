'use client'

import { useState, useEffect } from 'react'
import { Provider } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { LlmProvidersTab } from '@/components/LlmProvidersTab'
import { LlmKeysTab } from '@/components/LlmKeysTab'

export function LlmApiTab() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadProviders() }, [])

  const loadProviders = async () => {
    setIsLoading(true)
    try {
      const res = await api.listProviders()
      if (res.success && res.data) setProviders(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LlmProvidersTab onProvidersChange={loadProviders} />
      <LlmKeysTab providers={providers} onKeysChange={loadProviders} />
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-2">Use the following endpoint with your API key:</p>
          <code className="block bg-dark-light border border-gray-700 rounded px-4 py-3 text-primary font-mono">
            {typeof window !== 'undefined' ? window.location.origin : ''}:17534/v1/chat/completions
          </code>
          <p className="text-gray-500 text-sm mt-2">Authorization: Bearer zsp-your-api-key</p>
        </CardContent>
      </Card>
    </div>
  )
}