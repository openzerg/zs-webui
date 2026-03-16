'use client'

import { useState, useEffect } from 'react'
import { AccessToken } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2, Copy, Check } from 'lucide-react'

export function GitTokensTab() {
  const [tokens, setTokens] = useState<AccessToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({ username: '', name: '', scopes: '' })

  useEffect(() => { loadTokens() }, [])

  const loadTokens = async () => {
    setIsLoading(true)
    try {
      const res = await api.listTokens()
      if (res.success && res.data) setTokens(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.username || !formData.name) return
    setIsCreating(true)
    try {
      const scopes = formData.scopes ? formData.scopes.split(',').map(s => s.trim()) : undefined
      const res = await api.createToken({ ...formData, scopes })
      if (res.success && res.data) {
        setIsCreateModalOpen(false)
        setNewToken(res.data.sha1)
        setFormData({ username: '', name: '', scopes: '' })
        loadTokens()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (username: string, id: number) => {
    if (!confirm('Delete this token?')) return
    try { await api.deleteToken(username, id); loadTokens() }
    catch (e) { alert('Failed') }
  }

  const copyToClipboard = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Access Tokens</CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Create Token
          </Button>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No tokens</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">ID</th>
                  <th className="text-left py-3 px-4 text-primary">Scopes</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(token => (
                  <tr key={token.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{token.name}</td>
                    <td className="py-3 px-4 text-gray-400">{token.id}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{token.scopes.join(', ')}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="danger" size="sm" onClick={() => handleDelete('root', token.id)}>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Token">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="root" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Token Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="my-token" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scopes (comma-separated, optional)</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.scopes} onChange={e => setFormData({...formData, scopes: e.target.value})} 
              placeholder="read:repository,write:repository" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!newToken} onClose={() => setNewToken(null)} title="Token Created">
        <div className="space-y-4">
          <p className="text-red-400 font-medium">Save this token now - it won't be shown again!</p>
          <code className="block bg-dark-light border border-gray-700 rounded px-4 py-3 text-primary font-mono break-all">
            {newToken}
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