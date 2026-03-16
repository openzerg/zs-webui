'use client'

import { useState, useEffect } from 'react'
import { Organization, OrgMember } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2, Users } from 'lucide-react'

export function GitOrgsTab() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => { loadOrgs() }, [])

  const loadOrgs = async () => {
    setIsLoading(true)
    try {
      const res = await api.listOrgs()
      if (res.success && res.data) setOrgs(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const loadMembers = async (org: string) => {
    setSelectedOrg(org)
    try {
      const res = await api.listOrgMembers(org)
      if (res.success && res.data) setMembers(res.data)
    } catch (e) { console.error(e) }
  }

  const handleCreate = async () => {
    if (!formData.name) return
    setIsCreating(true)
    try {
      const res = await api.createOrg(formData)
      if (res.success) {
        setIsCreateModalOpen(false)
        setFormData({ name: '' })
        loadOrgs()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (org: string) => {
    if (!confirm(`Delete organization "${org}"?`)) return
    try { await api.deleteOrg(org); loadOrgs() }
    catch (e) { alert('Failed') }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Organizations</CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Create Org
          </Button>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No organizations</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Full Name</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{org.login}</td>
                    <td className="py-3 px-4 text-gray-400">{org.full_name}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => loadMembers(org.login)}>
                        <Users className="w-3 h-3 mr-1" />Members
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(org.login)}>
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

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedOrg ? `Members - ${selectedOrg}` : 'Members'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedOrg ? (
            <div className="text-center text-gray-400 py-8">Select an organization to view members</div>
          ) : members.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No members</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Username</th>
                  <th className="text-left py-3 px-4 text-primary">Full Name</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{member.login}</td>
                    <td className="py-3 px-4 text-gray-400">{member.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Organization">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}