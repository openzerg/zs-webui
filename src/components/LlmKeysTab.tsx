'use client'

import { useState, useEffect } from 'react'
import { ApiKey, Provider, CreateApiKeyResponse } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Key, Trash2, Copy, Check } from 'lucide-react'

interface LlmKeysTabProps {
  providers: Provider[]
  onKeysChange?: () => void
}

export function LlmKeysTab({ providers, onKeysChange }: LlmKeysTabProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isShowModalOpen, setIsShowModalOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '', provider_id: '' })

  useEffect(() => { loadKeys() }, [])

  const loadKeys = async () => {
    setIsLoading(true)
    try {
      const res = await api.listApiKeys()
      if (res.success && res.data) setApiKeys(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.provider_id) return
    setIsCreating(true)
    try {
      const res = await api.createApiKey(formData)
      if (res.success && res.data) {
        setIsModalOpen(false)
        setFormData({ name: '', provider_id: '' })
        setNewKey(res.data.key)
        setIsShowModalOpen(true)
        loadKeys()
        onKeysChange?.()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key?')) return
    try { await api.deleteApiKey(id); loadKeys(); onKeysChange?.() }
    catch (e) { alert('Failed') }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    return provider?.name || 'Unknown'
  }

  const openModal = () => {
    setFormData({ name: '', provider_id: providers[0]?.id || '' })
    setIsModalOpen(true)
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button onClick={openModal} disabled={providers.length === 0}>
            <Key className="w-4 h-4 mr-2" />Create Key
          </Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No API keys yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Provider</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(key => (
                  <tr key={key.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{key.name}</td>
                    <td className="py-3 px-4 text-gray-400">{getProviderName(key.provider_id)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(key.id)}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create API Key">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Key Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="e.g., agent-1-key" value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Provider</label>
            <select className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.provider_id} onChange={e => setFormData({...formData, provider_id: e.target.value})}>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShowModalOpen} onClose={() => setIsShowModalOpen(false)} title="API Key Created">
        <div className="space-y-4">
          <p className="text-red-400 font-medium">Save this key now - it won't be shown again!</p>
          <code className="block bg-dark-light border border-gray-700 rounded px-4 py-3 text-primary font-mono break-all">
            {newKey}
          </code>
          <Button onClick={copyToClipboard} className="w-full">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </Modal>
    </>
  )
}