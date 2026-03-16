'use client'

import { useState, useEffect } from 'react'
import { GitRepository } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Plus, Trash2 } from 'lucide-react'

export function GitReposTab() {
  const [repos, setRepos] = useState<GitRepository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => { loadRepos() }, [])

  const loadRepos = async () => {
    setIsLoading(true)
    try {
      const res = await api.listGitRepos()
      if (res.success && res.data) setRepos(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (!formData.name) return
    setIsCreating(true)
    try {
      const res = await api.createGitRepo(formData)
      if (res.success) {
        setIsCreateModalOpen(false)
        setFormData({ name: '', description: '' })
        loadRepos()
      } else alert(res.error || 'Failed')
    } catch (e) { alert('Failed') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (owner: string, repo: string) => {
    if (!confirm(`Delete ${owner}/${repo}?`)) return
    try { await api.deleteGitRepo(owner, repo); loadRepos() }
    catch (e) { alert('Failed') }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Repositories</CardTitle>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Create Repo
          </Button>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No repositories yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-primary">Name</th>
                  <th className="text-left py-3 px-4 text-primary">Owner</th>
                  <th className="text-left py-3 px-4 text-primary">Visibility</th>
                  <th className="text-left py-3 px-4 text-primary">URL</th>
                  <th className="text-right py-3 px-4 text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repos.map(repo => (
                  <tr key={repo.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">{repo.name}</td>
                    <td className="py-3 px-4 text-gray-400">{repo.owner.login}</td>
                    <td className="py-3 px-4">
                      {repo.private ? <span className="text-yellow-400">Private</span> : <span className="text-green-400">Public</span>}
                    </td>
                    <td className="py-3 px-4">
                      <a href={repo.html_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm">
                        {repo.html_url}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(repo.owner.login, repo.name)}>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Repository">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Repository Name</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <input className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <p className="text-sm text-gray-500">Repository will be created as private by default.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isCreating}>Create</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}