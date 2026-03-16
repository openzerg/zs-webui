'use client'

import { useState } from 'react'
import { Branch } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2, Shield } from 'lucide-react'

export function GitBranchesTab() {
  const [selectedRepo, setSelectedRepo] = useState<{owner: string, repo: string} | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ branch: '', reference: '' })

  const loadBranches = async (owner: string, repo: string) => {
    setIsLoading(true)
    try {
      const res = await api.listBranches(owner, repo)
      if (res.success && res.data) setBranches(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleSelectRepo = () => {
    const input = prompt('Enter repository (owner/repo):')
    if (input) {
      const parts = input.split('/')
      if (parts.length === 2) {
        setSelectedRepo({ owner: parts[0], repo: parts[1] })
        loadBranches(parts[0], parts[1])
      }
    }
  }

  const handleCreate = async () => {
    if (!selectedRepo || !formData.branch) return
    setIsCreating(true)
    try {
      const res = await api.createBranch(selectedRepo.owner, selectedRepo.repo, {
        branch: formData.branch,
        reference: formData.reference || undefined
      })
      if (res.success) {
        setIsCreateModalOpen(false)
        setFormData({ branch: '', reference: '' })
        loadBranches(selectedRepo.owner, selectedRepo.repo)
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (branch: string) => {
    if (!selectedRepo || !confirm(`Delete branch "${branch}"?`)) return
    try {
      await api.deleteBranch(selectedRepo.owner, selectedRepo.repo, branch)
      loadBranches(selectedRepo.owner, selectedRepo.repo)
    } catch (e) { alert('Failed') }
  }

  const handleProtect = async (branch: string) => {
    if (!selectedRepo) return
    try {
      await api.protectBranch(selectedRepo.owner, selectedRepo.repo, branch)
      loadBranches(selectedRepo.owner, selectedRepo.repo)
    } catch (e) { alert('Failed') }
  }

  if (!selectedRepo) {
    return (
      <Card>
        <CardHeader><CardTitle>Branches</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Select a repository to manage branches</p>
            <Button onClick={handleSelectRepo}>Select Repository</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Branches - {selectedRepo.owner}/{selectedRepo.repo}
            <Button variant="secondary" size="sm" className="ml-4" onClick={() => setSelectedRepo(null)}>
              Change Repo
            </Button>
          </CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Create Branch
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : branches.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No branches</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Protected</th>
                  <th className="text-left py-3 px-4 text-primary">Last Commit</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(branch => (
                  <tr key={branch.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{branch.name}</td>
                    <td className="py-3 px-4">
                      {branch.protected ? <span className="text-green-400">Yes</span> : <span className="text-gray-500">No</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm truncate max-w-xs">
                      {branch.commit.message}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!branch.protected && (
                        <Button variant="secondary" size="sm" onClick={() => handleProtect(branch.name)}>
                          <Shield className="w-3 h-3 mr-1" />Protect
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(branch.name)}>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Branch">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Branch Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Reference (default: main)</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="main" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}