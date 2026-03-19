'use client'

import { useState, useEffect } from 'react'
import { Model, Provider } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Box, Trash2, Power, PowerOff } from 'lucide-react'

interface LlmModelsTabProps {
  providers: Provider[]
  onModelsChange?: () => void
}

export function LlmModelsTab({ providers, onModelsChange }: LlmModelsTabProps) {
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '', provider_id: '', model_name: '' })

  useEffect(() => { loadModels() }, [])

  const loadModels = async () => {
    setIsLoading(true)
    try {
      const res = await api.listModels()
      if (res.success && res.data) setModels(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.provider_id || !formData.model_name) return
    setIsCreating(true)
    try {
      const res = await api.createModel(formData)
      if (res.success) {
        setIsModalOpen(false)
        setFormData({ name: '', provider_id: '', model_name: '' })
        loadModels()
        onModelsChange?.()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this model? Agents bound to this model will be unbound.')) return
    try { await api.deleteModel(id); loadModels(); onModelsChange?.() }
    catch (e) { alert('Failed') }
  }

  const handleToggle = async (model: Model) => {
    try {
      if (model.enabled) {
        await api.disableModel(model.id)
      } else {
        await api.enableModel(model.id)
      }
      loadModels()
    } catch (e) { alert('Failed') }
  }

  const openModal = () => {
    setFormData({ name: '', provider_id: providers[0]?.id || '', model_name: '' })
    setIsModalOpen(true)
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Models</CardTitle>
          <Button onClick={openModal} disabled={providers.length === 0}>
            <Box className="w-4 h-4 mr-2" />Create Model
          </Button>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No models yet. Create a provider first, then add models.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Model</th>
                  <th className="text-left py-3 px-4 text-primary">Provider</th>
                  <th className="text-left py-3 px-4 text-primary">Status</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{model.name}</td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-400">{model.model_name}</td>
                    <td className="py-3 px-4 text-gray-400">{model.provider_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${model.enabled ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {model.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleToggle(model)} className="mr-2">
                        {model.enabled ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(model.id)}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Model">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="e.g., GPT-4, Claude" value={formData.name}
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model Name (real)</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="e.g., gpt-4o, claude-3-opus" value={formData.model_name}
              onChange={e => setFormData({...formData, model_name: e.target.value})} />
            <p className="text-xs text-gray-500 mt-1">The actual model identifier used in API calls</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}