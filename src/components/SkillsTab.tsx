'use client'

import { useState, useEffect } from 'react'
import { Skill, Agent } from '@/lib/types'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Plus, Trash2, Key, Users, Upload, Play, Eye, EyeOff } from 'lucide-react'

interface SkillsTabProps {
  agents: Agent[]
}

export function SkillsTab({ agents }: SkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [secrets, setSecrets] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showInvokeModal, setShowInvokeModal] = useState(false)
  const [newSecretKey, setNewSecretKey] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [authAgent, setAuthAgent] = useState('')
  const [uploadFilename, setUploadFilename] = useState('')
  const [uploadContent, setUploadContent] = useState('')
  const [invokeCaller, setInvokeCaller] = useState('')
  const [invokeInput, setInvokeInput] = useState('{}')
  const [invokeResult, setInvokeResult] = useState<string | null>(null)

  useEffect(() => { loadSkills() }, [])

  const loadSkills = async () => {
    setIsLoading(true)
    try {
      const res = await api.listSkills()
      if (res.success && res.data) setSkills(res.data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const loadSecrets = async (skillId: string) => {
    try {
      const res = await api.listSkillSecrets(skillId)
      if (res.success && res.data) setSecrets(res.data)
    } catch (e) { console.error(e) }
  }

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkill(skill)
    loadSecrets(skill.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this skill?')) return
    await api.deleteSkill(id)
    setSelectedSkill(null)
    loadSkills()
  }

  const handleSetSecret = async () => {
    if (!selectedSkill || !newSecretKey || !newSecretValue) return
    await api.setSkillSecret(selectedSkill.id, { key: newSecretKey, value: newSecretValue })
    setNewSecretKey('')
    setNewSecretValue('')
    setShowSecretModal(false)
    loadSecrets(selectedSkill.id)
  }

  const handleDeleteSecret = async (key: string) => {
    if (!selectedSkill) return
    if (!confirm(`Delete secret "${key}"?`)) return
    await api.deleteSkillSecret(selectedSkill.id, key)
    loadSecrets(selectedSkill.id)
  }

  const handleAuthorize = async () => {
    if (!selectedSkill || !authAgent) return
    await api.authorizeSkill(selectedSkill.id, { agent_name: authAgent })
    setAuthAgent('')
    setShowAuthModal(false)
    loadSkills()
    const updated = skills.find(s => s.id === selectedSkill.id)
    if (updated) setSelectedSkill(updated)
  }

  const handleRevoke = async (agentName: string) => {
    if (!selectedSkill) return
    await api.revokeSkill(selectedSkill.id, { agent_name: agentName })
    loadSkills()
    const updated = skills.find(s => s.id === selectedSkill.id)
    if (updated) setSelectedSkill(updated)
  }

  const handleUpload = async () => {
    if (!selectedSkill || !uploadFilename || !uploadContent) return
    await api.uploadSkillFile(selectedSkill.id, { filename: uploadFilename, content: uploadContent })
    setUploadFilename('')
    setUploadContent('')
    setShowUploadModal(false)
  }

  const handleInvoke = async () => {
    if (!selectedSkill || !invokeCaller) return
    try {
      const input = JSON.parse(invokeInput)
      const res = await api.invokeSkill(selectedSkill.id, { caller_agent: invokeCaller, input })
      if (res.success && res.data) {
        if (res.data.success) {
          setInvokeResult(JSON.stringify(res.data.output, null, 2))
        } else {
          setInvokeResult(`Error: ${res.data.error}`)
        }
      } else {
        setInvokeResult(`Error: ${res.error}`)
      }
    } catch (e) {
      setInvokeResult(`Error: ${e}`)
    }
  }

  if (isLoading) return <div className="text-center text-gray-400 py-8">Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No skills yet</p>
          ) : (
            <div className="space-y-2">
              {skills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedSkill?.id === skill.id
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-dark-light hover:bg-dark-lighter border border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      skill.enabled ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {skill.skill_type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Owner: {skill.owner_agent}</div>
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
              <Button variant="danger" size="sm" onClick={() => handleDelete(selectedSkill.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  <span className="font-mono">{selectedSkill.skill_type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Entrypoint:</span>{' '}
                  <span className="font-mono">{selectedSkill.entrypoint}</span>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Secrets</h4>
                    <Button size="sm" variant="secondary" onClick={() => setShowSecretModal(true)}>
                      <Key className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  {secrets.length === 0 ? (
                    <p className="text-gray-500 text-sm">No secrets</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {secrets.map(key => (
                        <div key={key} className="flex items-center gap-1 bg-dark-light px-2 py-1 rounded text-sm">
                          <span>{key}</span>
                          <button onClick={() => handleDeleteSecret(key)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Authorized Agents</h4>
                    <Button size="sm" variant="secondary" onClick={() => setShowAuthModal(true)}>
                      <Users className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.allowed_agents.map(agent => (
                      <div key={agent} className="flex items-center gap-1 bg-dark-light px-2 py-1 rounded text-sm">
                        <span>{agent}</span>
                        {agent !== selectedSkill.owner_agent && (
                          <button onClick={() => handleRevoke(agent)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4 mr-1" /> Upload File
                  </Button>
                  <Button onClick={() => setShowInvokeModal(true)}>
                    <Play className="w-4 h-4 mr-1" /> Invoke
                  </Button>
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

      {showSecretModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Secret</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Key (e.g., API_KEY)"
                value={newSecretKey}
                onChange={e => setNewSecretKey(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              />
              <textarea
                placeholder="Value"
                value={newSecretValue}
                onChange={e => setNewSecretValue(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-24"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowSecretModal(false)}>Cancel</Button>
              <Button onClick={handleSetSecret}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Authorize Agent</h3>
            <select
              value={authAgent}
              onChange={e => setAuthAgent(e.target.value)}
              className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="">Select agent</option>
              {agents.filter(a => !selectedSkill?.allowed_agents.includes(a.name)).map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowAuthModal(false)}>Cancel</Button>
              <Button onClick={handleAuthorize}>Authorize</Button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Upload File</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Filename (e.g., script.py)"
                value={uploadFilename}
                onChange={e => setUploadFilename(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              />
              <textarea
                placeholder="File content"
                value={uploadContent}
                onChange={e => setUploadContent(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-48 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button onClick={handleUpload}>Upload</Button>
            </div>
          </div>
        </div>
      )}

      {showInvokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark border border-gray-700 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Invoke Skill</h3>
            <div className="space-y-4">
              <select
                value={invokeCaller}
                onChange={e => setInvokeCaller(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="">Select caller agent</option>
                {agents.filter(a => selectedSkill?.allowed_agents.includes(a.name)).map(a => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
              <textarea
                placeholder='JSON input (e.g., {"query": "hello"})'
                value={invokeInput}
                onChange={e => setInvokeInput(e.target.value)}
                className="w-full bg-dark-light border border-gray-700 rounded px-3 py-2 text-white h-24 font-mono text-sm"
              />
              {invokeResult && (
                <pre className="bg-dark-light border border-gray-700 rounded p-3 text-sm overflow-auto max-h-48">
                  {invokeResult}
                </pre>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowInvokeModal(false); setInvokeResult(null) }}>Close</Button>
              <Button onClick={handleInvoke}>Invoke</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}