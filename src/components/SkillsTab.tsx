'use client'

import { useState, useEffect } from 'react'
import { Skill, Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { CreateSkillModal } from '@/components/CreateSkillModal'

interface SkillsTabProps {
  agents: Agent[]
}

export function SkillsTab({ agents }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => { loadSkills() }, [])

  const loadSkills = async () => {
    setIsLoading(true)
    try {
      const res = await api.listSkills()
      if (res.success && res.data) setSkills(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this skill?')) return
    await api.deleteSkill(slug)
    setSelectedSkill(null)
    loadSkills()
  }

  const handlePull = async (slug: string) => {
    const res = await api.pullSkill(slug)
    if (res.success) {
      loadSkills()
      if (selectedSkill?.slug === slug && res.data) {
        setSelectedSkill(res.data)
      }
    } else {
      alert(res.error || 'Failed to pull skill')
    }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Clone
          </Button>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No skills yet</p>
          ) : (
            <div className="space-y-2">
              {skills.map(skill => (
                <div
                  key={skill.slug}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedSkill?.slug === skill.slug
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-dark-light hover:bg-dark-lighter border border-gray-700'
                  }`}
                >
                  <div className="font-medium">{skill.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {skill.forgejo_repo} ({skill.git_commit.slice(0, 8)})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {selectedSkill ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedSkill.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handlePull(selectedSkill.slug)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(selectedSkill.slug)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400">Slug:</span>{' '}
                  <span className="font-mono">{selectedSkill.slug}</span>
                </div>
                <div>
                  <span className="text-gray-400">Version:</span>{' '}
                  <span className="font-mono">{selectedSkill.version}</span>
                </div>
                <div>
                  <span className="text-gray-400">Description:</span>{' '}
                  <span>{selectedSkill.description}</span>
                </div>
                <div>
                  <span className="text-gray-400">Repo:</span>{' '}
                  <span className="font-mono">{selectedSkill.forgejo_repo}</span>
                </div>
                <div>
                  <span className="text-gray-400">Commit:</span>{' '}
                  <span className="font-mono">{selectedSkill.git_commit.slice(0, 8)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Author:</span>{' '}
                  <span>{selectedSkill.author_agent}</span>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <p className="text-gray-400 text-center py-8">Select a skill to view details</p>
          </CardContent>
        )}
      </Card>

      <CreateSkillModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        agents={agents}
        onCreated={loadSkills}
      />
    </div>
  )
}