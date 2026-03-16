'use client'

import { useState, useEffect } from 'react'
import { Provider } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2 } from 'lucide-react'

interface LlmProvidersTabProps {
  onProvidersChange?: () => void
}

export function LlmProvidersTab({ onProvidersChange }: LlmProvidersTabProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider_type: 'openai',
    base_url: '',
    api_key: ''
  })

  useEffect(() => { loadProviders() }, [])

  const loadProviders = async () => {
    setIsLoading(true)
    try {
      const res = await api.listProviders()
      if (res.success && res.data) setProviders(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.base_url || !formData.api_key) return
    setIsCreating(true)
    try {
      const res = await api.createProvider(formData)
      if (res.success) {
        setIsModalOpen(false)
        setFormData({ name: '', provider_type: 'openai', base_url: '', api_key: '' })
        loadProviders()
        onProvidersChange?.()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this provider?')) return
    try { await api.deleteProvider(id); loadProviders(); onProvidersChange?.() }
    catch (e) { alert('Failed') }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      if (enabled) await api.enableProvider(id)
      else await api.disableProvider(id)
      loadProviders()
    } catch (e) { alert('Failed') }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Providers</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Provider</Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No providers yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Type</th>
                  <th className="text-left py-3 px-4 text-primary">Status</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{p.name}</td>
                    <td className="py-3 px-4 text-gray-400">{p.provider_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${p.enabled ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-400'}`}>
                        {p.enabled ? 'enabled' : 'disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleToggle(p.id, !p.enabled)}>
                        {p.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="danger" size="sm" className="ml-2" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add LLM Provider">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Provider Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="e.g., OpenAI, DeepSeek" value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Provider Type</label>
            <select className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.provider_type} onChange={e => setFormData({...formData, provider_type: e.target.value})}>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
              <option value="moonshot">Moonshot</option>
              <option value="zhipu">Zhipu</option>
              <option value="custom">Custom (OpenAI-compatible)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base URL</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="https://api.openai.com" value={formData.base_url}
              onChange={e => setFormData({...formData, base_url: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input type="password" className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.api_key} onChange={e => setFormData({...formData, api_key: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Add</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}