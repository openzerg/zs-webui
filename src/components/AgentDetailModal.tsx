'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { FileInfo, FileContent, Agent, Session, Message, Process, Activity, Task, ToolCallData } from '@/lib/types'
import { Modal } from './Modal'
import { Button } from './Button'
import { X, Folder, File, ChevronRight, Save, RefreshCw, Send, AlertTriangle, Clock, Terminal, ListTodo, Activity as ActivityIcon, MessageSquare, Zap, Wrench, ChevronDown, Bot, Cpu, User, CheckCircle2 } from 'lucide-react'
import ToolExecutor from './ToolExecutor'

interface AgentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent
}

type TabType = 'chat' | 'processes' | 'tasks' | 'activities' | 'files' | 'tools'

type SendMessageType = 'message' | 'interrupt' | 'remind' | 'assign_task'

export function AgentDetailModal({ isOpen, onClose, agent }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [isLoading, setIsLoading] = useState(false)
  
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set())
  
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [processOutput, setProcessOutput] = useState('')
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  
  const [messageInput, setMessageInput] = useState('')
  const [messageType, setMessageType] = useState<SendMessageType>('message')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && agent.online) loadData()
  }, [isOpen, agent.name, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedSession) {
      const sessionType = getSessionType(selectedSession.purpose)
      if (sessionType === 'worker') {
        setMessageType('interrupt')
      } else if (sessionType === 'dispatcher') {
        setMessageType('assign_task')
      } else {
        setMessageType('message')
      }
    }
  }, [selectedSession])

  const getSessionType = (purpose: string): 'main' | 'dispatcher' | 'worker' | 'task' => {
    const p = purpose.toLowerCase()
    if (p.includes('dispatcher')) return 'dispatcher'
    if (p.includes('worker')) return 'worker'
    if (p.includes('task')) return 'task'
    return 'main'
  }

  const getSessionIcon = (purpose: string) => {
    const type = getSessionType(purpose)
    switch (type) {
      case 'dispatcher': return <Cpu className="w-4 h-4 text-blue-400" />
      case 'worker': return <Bot className="w-4 h-4 text-green-400" />
      case 'task': return <CheckCircle2 className="w-4 h-4 text-purple-400" />
      default: return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getSessionDisplayName = (s: Session) => {
    const type = getSessionType(s.purpose)
    if (type === 'main') return 'Main Session'
    if (type === 'dispatcher') return 'Dispatcher'
    if (type === 'worker') return 'Worker'
    return s.purpose
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      switch (activeTab) {
        case 'chat':
          const sessionsRes = await api.listSessions(agent.name)
          if (sessionsRes.success && sessionsRes.data) {
            setSessions(sessionsRes.data.sessions)
            if (!selectedSession && sessionsRes.data.sessions.length > 0) {
              const mainSession = sessionsRes.data.sessions.find(s => getSessionType(s.purpose) === 'main')
              const sessionToSelect = mainSession || sessionsRes.data.sessions[0]
              setSelectedSession(sessionToSelect)
              loadSessionMessages(sessionToSelect.id)
            }
          }
          break
        case 'processes':
          const processesRes = await api.listProcesses(agent.name)
          if (processesRes.success && processesRes.data) setProcesses(processesRes.data.processes)
          break
        case 'tasks':
          const tasksRes = await api.listTasks(agent.name)
          if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data.tasks)
          break
        case 'activities':
          const activitiesRes = await api.listActivities(agent.name)
          if (activitiesRes.success && activitiesRes.data) setActivities(activitiesRes.data.activities)
          break
        case 'files':
          loadFiles('')
          break
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessionMessages = async (sessionId: string) => {
    const res = await api.getSessionMessages(agent.name, sessionId)
    if (res.success && res.data) setMessages(res.data.messages)
  }

  const loadProcessOutput = async (processId: string) => {
    const res = await api.getProcessOutput(agent.name, processId)
    if (res.success && res.data) setProcessOutput(res.data.content)
  }

  const loadFiles = async (path: string) => {
    setIsLoading(true)
    try {
      if (path) {
        const res = await api.getFile(agent.name, path)
        if (res.success && res.data) {
          if ('content' in res.data) {
            setSelectedFile(res.data as FileContent)
            setEditContent((res.data as FileContent).content)
          } else {
            setFiles(res.data as FileInfo[])
            setCurrentPath(path)
            setSelectedFile(null)
          }
        }
      } else {
        const res = await api.listFiles(agent.name)
        if (res.success && res.data) {
          setFiles(res.data as FileInfo[])
          setCurrentPath('')
          setSelectedFile(null)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = (file: FileInfo) => loadFiles(file.path)
  const handleBack = () => {
    const parts = currentPath.split('/')
    parts.pop()
    loadFiles(parts.join('/'))
  }

  const handleSave = async () => {
    if (!selectedFile) return
    setIsLoading(true)
    await api.updateFile(agent.name, selectedFile.path, editContent)
    setSelectedFile({ ...selectedFile, content: editContent, size: editContent.length })
    setIsLoading(false)
  }

  const handleSelectSession = (s: Session) => {
    setSelectedSession(s)
    loadSessionMessages(s.id)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return
    const msg = messageInput
    setMessageInput('')
    
    if (selectedSession) {
      const sessionType = getSessionType(selectedSession.purpose)
      if (sessionType === 'main' || messageType === 'message') {
        await api.sendSessionChat(agent.name, selectedSession.id, msg)
      } else if (messageType === 'interrupt') {
        await api.sendSessionInterrupt(agent.name, selectedSession.id, msg)
      } else if (messageType === 'remind') {
        await api.sendRemind(agent.name, msg)
      } else if (messageType === 'assign_task') {
        await api.sendMessage(agent.name, `[TASK] ${msg}`)
      }
      loadSessionMessages(selectedSession.id)
    } else {
      await api.sendMessage(agent.name, msg)
    }
  }

  const toggleToolCall = (id: string) => {
    setExpandedToolCalls(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pathParts = currentPath.split('/').filter(Boolean)
  if (!isOpen) return null

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'processes', label: 'Processes', icon: <Terminal className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'activities', label: 'Activity', icon: <ActivityIcon className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <Folder className="w-4 h-4" /> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
  ]

  const getMessageTypeOptions = (): { value: SendMessageType; label: string; icon: React.ReactNode }[] => {
    if (!selectedSession) return [{ value: 'message', label: 'Message', icon: <Send className="w-3 h-3" /> }]
    
    const sessionType = getSessionType(selectedSession.purpose)
    switch (sessionType) {
      case 'worker':
        return [
          { value: 'interrupt', label: 'Interrupt', icon: <AlertTriangle className="w-3 h-3" /> },
          { value: 'remind', label: 'Remind', icon: <Clock className="w-3 h-3" /> },
        ]
      case 'dispatcher':
        return [
          { value: 'assign_task', label: 'Assign Task', icon: <ListTodo className="w-3 h-3" /> },
        ]
      default:
        return [
          { value: 'message', label: 'Message', icon: <Send className="w-3 h-3" /> },
        ]
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-6xl">
      <div className="flex flex-col min-h-[70vh] max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-primary">{agent.name}</h2>
            <p className="text-sm text-gray-400">{agent.online ? 'Online' : 'Offline'} - {agent.container_ip}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 mb-4 border-b border-gray-700 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedProcess(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-t transition whitespace-nowrap ${activeTab === tab.id ? 'bg-dark-light text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {!agent.online ? (
            <div className="text-center py-12 text-gray-400">Agent is offline.</div>
          ) : isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <>
              {activeTab === 'chat' && (
                <div className="flex h-[55vh]">
                  <div className="w-64 border-r border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700 bg-dark-lighter">
                      <h3 className="text-sm font-medium text-gray-300">Sessions</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                      {sessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No sessions</div>
                      ) : (
                        sessions.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectSession(s)}
                            className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-dark-lighter transition ${selectedSession?.id === s.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {getSessionIcon(s.purpose)}
                              <span className="font-medium text-sm">{getSessionDisplayName(s)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">{s.message_count} msgs</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${s.state === 'Completed' ? 'bg-green-900/50 text-green-400' : s.state === 'Generating' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>{s.state}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {selectedSession ? (
                      <>
                        <div className="p-3 border-b border-gray-700 bg-dark-lighter flex items-center gap-2">
                          {getSessionIcon(selectedSession.purpose)}
                          <span className="font-medium">{getSessionDisplayName(selectedSession)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${selectedSession.state === 'Completed' ? 'bg-green-900/50 text-green-400' : selectedSession.state === 'Generating' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>{selectedSession.state}</span>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                          {messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">No messages yet</div>
                          ) : (
                            messages.map(m => (
                              <div key={m.id}>
                                <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] rounded-lg p-3 ${
                                    m.role === 'user' 
                                      ? 'bg-primary text-white' 
                                      : m.role === 'tool' 
                                        ? 'bg-gray-800 border border-gray-600' 
                                        : 'bg-dark-lighter border border-gray-700'
                                  }`}>
                                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                                      {m.role === 'user' && <User className="w-3 h-3" />}
                                      {m.role === 'assistant' && <Bot className="w-3 h-3" />}
                                      {m.role === 'tool' && <Wrench className="w-3 h-3" />}
                                      {m.role}
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                                  </div>
                                </div>
                                
                                {m.tool_calls && m.tool_calls.length > 0 && (
                                  <div className="mt-2 ml-4 space-y-2">
                                    {m.tool_calls.map((tc) => (
                                      <div key={tc.id} className="border border-gray-700 rounded-lg overflow-hidden">
                                        <div
                                          onClick={() => toggleToolCall(tc.id)}
                                          className="flex items-center justify-between p-2 bg-dark-lighter cursor-pointer hover:bg-gray-800 transition"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Wrench className="w-4 h-4 text-yellow-500" />
                                            <span className="font-mono text-sm">{tc.name}</span>
                                          </div>
                                          <ChevronDown className={`w-4 h-4 transition ${expandedToolCalls.has(tc.id) ? 'rotate-180' : ''}`} />
                                        </div>
                                        {expandedToolCalls.has(tc.id) && (
                                          <div className="p-3 border-t border-gray-700 bg-dark">
                                            <div className="mb-2">
                                              <div className="text-xs text-gray-500 mb-1">Arguments</div>
                                              <pre className="text-xs bg-dark-lighter p-2 rounded overflow-auto">{JSON.stringify(tc.arguments, null, 2)}</pre>
                                            </div>
                                            {tc.result && (
                                              <div>
                                                <div className="text-xs text-gray-500 mb-1">Result</div>
                                                <pre className="text-xs bg-dark-lighter p-2 rounded overflow-auto max-h-48">{typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}</pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="p-3 border-t border-gray-700 bg-dark-lighter">
                          <div className="flex gap-2">
                            <div className="relative">
                              <select
                                value={messageType}
                                onChange={(e) => setMessageType(e.target.value as SendMessageType)}
                                className="appearance-none bg-dark border border-gray-600 rounded px-3 py-2 pr-8 text-sm cursor-pointer focus:outline-none focus:border-primary"
                              >
                                {getMessageTypeOptions().map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              className="flex-1 px-3 py-2 bg-dark border border-gray-600 rounded text-sm focus:outline-none focus:border-primary"
                            />
                            <Button onClick={handleSendMessage}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a session to start chatting
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'processes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-700 rounded overflow-auto max-h-[50vh]">
                    <div className="p-2 bg-dark-lighter border-b border-gray-700 font-medium text-sm">Processes</div>
                    {processes.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">No processes</div> : processes.map(p => (
                      <div key={p.id} onClick={() => { setSelectedProcess(p); loadProcessOutput(p.id) }} className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-dark-lighter ${selectedProcess?.id === p.id ? 'bg-primary/10' : ''}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{p.id.slice(0, 8)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'Completed' ? 'bg-green-900/50 text-green-400' : p.status === 'Running' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>{p.status}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">{p.command}</div>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-2 border border-gray-700 rounded overflow-auto max-h-[50vh]">
                    <div className="p-2 bg-dark-lighter border-b border-gray-700 font-medium text-sm">Output</div>
                    {selectedProcess ? <pre className="p-3 text-xs font-mono whitespace-pre-wrap overflow-auto">{processOutput || 'No output'}</pre> : <div className="p-4 text-center text-gray-400 text-sm">Select a process</div>}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="border border-gray-700 rounded overflow-auto max-h-[50vh]">
                  {tasks.length === 0 ? <div className="p-4 text-center text-gray-400">No tasks</div> : (
                    <table className="w-full text-sm">
                      <thead className="bg-dark-lighter"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Content</th><th className="text-left p-3">Status</th><th className="text-left p-3">Priority</th></tr></thead>
                      <tbody>{tasks.map(t => (
                        <tr key={t.id} className="border-t border-gray-800">
                          <td className="p-3 font-mono text-xs">{t.id.slice(0, 8)}</td>
                          <td className="p-3">{t.content}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${t.status.toLowerCase() === 'completed' ? 'bg-green-900/50 text-green-400' : t.status.toLowerCase() === 'in_progress' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-300'}`}>{t.status}</span></td>
                          <td className="p-3"><span className={`text-xs ${t.priority.toLowerCase() === 'high' ? 'text-red-400' : t.priority.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-gray-400'}`}>{t.priority}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="border border-gray-700 rounded overflow-auto max-h-[50vh]">
                  {activities.length === 0 ? <div className="p-4 text-center text-gray-400">No activities</div> : (
                    <div className="divide-y divide-gray-800">{activities.map(a => (
                      <div key={a.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${a.activity_type === 'FileRead' ? 'bg-blue-900/50 text-blue-400' : a.activity_type === 'FileWrite' ? 'bg-green-900/50 text-green-400' : a.activity_type === 'ProcessStart' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-gray-700 text-gray-300'}`}>{a.activity_type}</span>
                          <span className="text-xs text-gray-400">{a.timestamp}</span>
                        </div>
                        <div className="text-sm mt-1">{a.description}</div>
                      </div>
                    ))}</div>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                  {selectedFile ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <button onClick={handleBack} className="hover:text-primary">files</button>
                          {pathParts.map((part, i) => (<span key={i} className="flex items-center gap-2"><ChevronRight className="w-3 h-3" /><span>{part}</span></span>))}
                        </div>
                        <Button size="sm" onClick={handleSave} disabled={isLoading}><Save className="w-4 h-4 mr-1" /> Save</Button>
                      </div>
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-96 bg-dark-lighter border border-gray-700 rounded p-3 font-mono text-sm text-gray-100 resize-none focus:outline-none focus:border-primary" spellCheck={false} />
                    </div>
                  ) : (
                    <div>
                      {currentPath && <button onClick={handleBack} className="mb-3 text-sm text-gray-400 hover:text-primary flex items-center gap-1"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>}
                      <div className="flex justify-end mb-2"><Button variant="secondary" size="sm" onClick={() => loadFiles(currentPath)}><RefreshCw className="w-4 h-4" /></Button></div>
                      {files.length === 0 ? <div className="text-center py-8 text-gray-400">No files</div> : (
                        <div className="border border-gray-700 rounded max-h-[50vh] overflow-auto">{files.map((file, i) => (
                          <div key={file.path} onClick={() => handleFileClick(file)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-lighter ${i < files.length - 1 ? 'border-b border-gray-800' : ''}`}>
                            {file.is_dir ? <Folder className="w-5 h-5 text-yellow-500" /> : <File className="w-5 h-5 text-gray-400" />}
                            <span className="flex-1">{file.name}</span>
                            {!file.is_dir && <span className="text-xs text-gray-400">{file.size} B</span>}
                          </div>
                        ))}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="max-h-[50vh] overflow-auto">
                  <ToolExecutor agentName={agent.name} sessionId={selectedSession?.id} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}