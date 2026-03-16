'use client'

import { useState, useEffect } from 'react'
import { ForgejoUser, Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2, Link, Unlink } from 'lucide-react'

interface GitAccountsTabProps {
  agents: Agent[]
}

export function GitAccountsTab({ agents }: GitAccountsTabProps) {
  const [users, setUsers] = useState<ForgejoUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBindModalOpen, setIsBindModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '' })

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const res = await api.listForgejoUsers()
      if (res.success && res.data) setUsers(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.username || !formData.password) return
    setIsCreating(true)
    try {
      const res = await api.createForgejoUser(formData)
      if (res.success) {
        setIsCreateModalOpen(false)
        setFormData({ username: '', password: '' })
        loadUsers()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return
    try { await api.deleteForgejoUser(username); loadUsers() }
    catch (e) { alert('Failed') }
  }

  const handleBind = async (agentName: string) => {
    if (!selectedUser) return
    try {
      const res = await api.bindForgejoUser(agentName, selectedUser)
      if (res.success) { setIsBindModalOpen(false); setSelectedUser(null); loadUsers() }
      else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
  }

  const handleUnbind = async (agentName: string) => {
    if (!confirm('Unbind?')) return
    try { await api.unbindForgejoUser(agentName); loadUsers() }
    catch (e) { alert('Failed') }
  }

  const getBoundAgent = (username: string) => agents.find(a => a.forgejo_username === username)
  const unboundAgents = agents.filter(a => !a.forgejo_username)

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Git Accounts</CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Create User
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No users yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Username</th>
                  <th className="text-left py-3 px-4 text-primary">Email</th>
                  <th className="text-left py-3 px-4 text-primary">Bound Agent</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const bound = getBoundAgent(user.username)
                  return (
                    <tr key={user.username} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4 text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        {bound ? <span className="text-primary">{bound.name}</span> : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {bound ? (
                          <Button variant="warning" size="sm" onClick={() => handleUnbind(bound.name)}>
                            <Unlink className="w-3 h-3 mr-1" />Unbind
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => { setSelectedUser(user.username); setIsBindModalOpen(true) }}>
                            <Link className="w-3 h-3 mr-1" />Bind
                          </Button>
                        )}
                        <Button variant="danger" size="sm" className="ml-2" onClick={() => handleDelete(user.username)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Git User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBindModalOpen} onClose={() => { setIsBindModalOpen(false); setSelectedUser(null) }} title="Bind to Agent">
        <div className="space-y-4">
          <p className="text-gray-400">Bind user <span className="text-primary">{selectedUser}</span> to:</p>
          {unboundAgents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No unbound agents</p>
          ) : (
            <div className="space-y-2">
              {unboundAgents.map(a => (
                <button key={a.name} className="w-full text-left px-4 py-3 bg-dark-light rounded hover:bg-gray-700 transition"
                  onClick={() => handleBind(a.name)}>{a.name}</button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}