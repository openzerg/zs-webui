import { 
  ApiResponse, Agent, Provider, Model, Checkpoint, Tool, Skill,
  CreateAgentRequest, CreateProviderRequest, CreateModelRequest,
  CreateCheckpointRequest, RollbackRequest, CloneCheckpointRequest,
  InvokeToolRequest, SetEnvRequest, AuthorizeRequest,
  StatsSummary, Session, Message, Process, Task, Activity,
  FileInfo, FileResponse, ForgejoUser, GitRepository, Collaborator, Organization, OrgMember
} from '@/lib/types'

export type ApiMode = 'swarm' | 'agent'

interface ApiConfig {
  mode: ApiMode
  baseUrl: string
  grpcUrl: string
  token: string | null
}

const isBrowser = typeof window !== 'undefined'

function getBuildMode(): ApiMode {
  if (typeof process !== 'undefined' && process.env?.BUILD_MODE) {
    return process.env.BUILD_MODE as ApiMode
  }
  if (isBrowser && (window as unknown as { __BUILD_MODE__?: string }).__BUILD_MODE__) {
    return (window as unknown as { __BUILD_MODE__: string }).__BUILD_MODE__ as ApiMode
  }
  return 'swarm'
}

function getDefaultConfig(mode: ApiMode): { baseUrl: string; grpcUrl: string } {
  if (!isBrowser) return { baseUrl: '', grpcUrl: '' }
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  return {
    baseUrl: mode === 'swarm' ? `${protocol}//${hostname}:17531` : `${protocol}//${hostname}:8081`,
    grpcUrl: mode === 'swarm' ? `${hostname}:17532` : `${hostname}:50051`,
  }
}

class ApiClient {
  private config: ApiConfig

  constructor() {
    const mode = getBuildMode()
    const urls = getDefaultConfig(mode)
    this.config = {
      mode,
      baseUrl: urls.baseUrl,
      grpcUrl: urls.grpcUrl,
      token: isBrowser ? localStorage.getItem('auth') : null,
    }
  }

  get mode() { return this.config.mode }
  get baseUrl() { return this.config.baseUrl }
  get grpcUrl() { return this.config.grpcUrl }

  setToken(token: string | null) {
    this.config.token = token
    if (isBrowser) {
      if (token) localStorage.setItem('auth', token)
      else localStorage.removeItem('auth')
    }
  }

  getToken() { return this.config.token }
  isAuthenticated(): boolean { return this.config.token !== null }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
      })

      if (response.status === 401) {
        this.setToken(null)
        return { success: false, data: null, error: 'Unauthorized' }
      }

      return response.json()
    } catch (e) {
      return { success: false, data: null, error: e instanceof Error ? e.message : 'Network error' }
    }
  }

  // Auth
  async login(token: string): Promise<boolean> {
    this.setToken(token)
    const result = await this.listAgents()
    if (result.success) return true
    this.setToken(null)
    return false
  }

  logout() { this.setToken(null) }
  clearAuth() { this.setToken(null) }
  setAuth(token: string) { this.setToken(token) }

  // Health
  async checkHealth(): Promise<{ ok: boolean; version?: string }> {
    try {
      const resp = await fetch(`${this.config.baseUrl}/health`)
      if (resp.ok) {
        const data = await resp.json()
        return { ok: true, version: data.version }
      }
    } catch {}
    return { ok: false }
  }

  // Agents
  async listAgents(): Promise<ApiResponse<Agent[]>> {
    return this.fetch('/api/agents')
  }

  async createAgent(name: string | CreateAgentRequest, forgejoUsername?: string): Promise<ApiResponse<Agent>> {
    const req: CreateAgentRequest = typeof name === 'string' 
      ? { name, forgejo_username: forgejoUsername }
      : name
    return this.fetch('/api/agents', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async deleteAgent(name: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${name}`, { method: 'DELETE' })
  }

  async enableAgent(name: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${name}/enable`, { method: 'POST' })
  }

  async disableAgent(name: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${name}/disable`, { method: 'POST' })
  }

  async bindModel(agent: string, modelId: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${agent}/bind-model`, {
      method: 'POST',
      body: JSON.stringify({ model_id: modelId }),
    })
  }

  async unbindModel(agent: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${agent}/unbind-model`, { method: 'POST' })
  }

  // Stats
  async getStats(): Promise<ApiResponse<StatsSummary>> {
    return this.fetch('/api/stats/summary')
  }

  // Providers
  async listProviders(): Promise<ApiResponse<Provider[]>> {
    return this.fetch('/api/llm/providers')
  }

  async createProvider(req: CreateProviderRequest): Promise<ApiResponse<Provider>> {
    return this.fetch('/api/llm/providers', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async deleteProvider(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/providers/${id}`, { method: 'DELETE' })
  }

  async enableProvider(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/providers/${id}/enable`, { method: 'POST' })
  }

  async disableProvider(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/providers/${id}/disable`, { method: 'POST' })
  }

  // Models
  async listModels(): Promise<ApiResponse<Model[]>> {
    return this.fetch('/api/llm/models')
  }

  async createModel(req: CreateModelRequest): Promise<ApiResponse<Model>> {
    return this.fetch('/api/llm/models', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async deleteModel(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/models/${id}`, { method: 'DELETE' })
  }

  async enableModel(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/models/${id}/enable`, { method: 'POST' })
  }

  async disableModel(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/llm/models/${id}/disable`, { method: 'POST' })
  }

  // Checkpoints
  async listCheckpoints(agent?: string): Promise<ApiResponse<Checkpoint[]>> {
    if (agent) {
      return this.fetch(`/api/agents/${agent}/checkpoints`)
    }
    return this.fetch('/api/checkpoints')
  }

  async createCheckpoint(agent: string, req?: CreateCheckpointRequest | string): Promise<ApiResponse<Checkpoint>> {
    const body: CreateCheckpointRequest = typeof req === 'string' 
      ? { description: req }
      : req || {}
    return this.fetch(`/api/agents/${agent}/checkpoint`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async deleteCheckpoint(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/checkpoints/${id}`, { method: 'DELETE' })
  }

  async rollbackAgent(agent: string, checkpointId: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${agent}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ checkpoint_id: checkpointId }),
    })
  }

  async rollbackCheckpoint(agent: string, req: RollbackRequest): Promise<ApiResponse<void>> {
    return this.fetch(`/api/agents/${agent}/rollback`, {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async cloneCheckpoint(id: string, req: CloneCheckpointRequest | string): Promise<ApiResponse<Agent>> {
    const body: CloneCheckpointRequest = typeof req === 'string'
      ? { new_name: req }
      : req
    return this.fetch(`/api/checkpoints/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Skills
  async listSkills(): Promise<ApiResponse<Skill[]>> {
    return this.fetch('/api/skills')
  }

  async getSkill(slug: string): Promise<ApiResponse<Skill>> {
    return this.fetch(`/api/skills/${slug}`)
  }

  async createSkill(req: { slug: string; forgejo_repo: string; author_agent: string }): Promise<ApiResponse<Skill>> {
    return { success: false, data: null, error: 'Use gRPC for skill creation' }
  }

  async cloneSkill(_slug: string, _req: { author_agent: string; forgejo_repo: string }): Promise<ApiResponse<Skill>> {
    return { success: false, data: null, error: 'Use gRPC for skill cloning' }
  }

  async pullSkill(_slug: string): Promise<ApiResponse<Skill>> {
    return { success: false, data: null, error: 'Use gRPC for skill pull' }
  }

  async deleteSkill(slug: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/skills/${slug}`, { method: 'DELETE' })
  }

  // Tools
  async listTools(): Promise<ApiResponse<Tool[]>> {
    return this.fetch('/api/tools')
  }

  async getTool(slug: string): Promise<ApiResponse<Tool>> {
    return this.fetch(`/api/tools/${slug}`)
  }

  async createTool(req: { slug: string; forgejo_repo: string; author_agent: string }): Promise<ApiResponse<Tool>> {
    return { success: false, data: null, error: 'Use gRPC for tool creation' }
  }

  async deleteTool(slug: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/tools/${slug}`, { method: 'DELETE' })
  }

  async authorizeTool(slug: string, agentName: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/tools/${slug}/authorize`, {
      method: 'POST',
      body: JSON.stringify({ agent_name: agentName }),
    })
  }

  async revokeTool(slug: string, agentName: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/tools/${slug}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ agent_name: agentName }),
    })
  }

  async invokeTool(slug: string, req: InvokeToolRequest): Promise<ApiResponse<{ output: Record<string, unknown> | null; error: string | null }>> {
    return this.fetch(`/api/tools/${slug}/invoke`, {
      method: 'POST',
      body: JSON.stringify(req),
    })
  }

  async listToolEnv(slug: string): Promise<ApiResponse<string[]>> {
    return this.fetch(`/api/tools/${slug}/env`)
  }

  async setToolEnv(slug: string, key: string, value?: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/tools/${slug}/env`, {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    })
  }

  async deleteToolEnv(slug: string, key: string): Promise<ApiResponse<void>> {
    return this.fetch(`/api/tools/${slug}/env/${key}`, { method: 'DELETE' })
  }

  async cloneTool(_slug: string, _req: { author_agent: string; forgejo_repo: string }): Promise<ApiResponse<Tool>> {
    return { success: false, data: null, error: 'Use gRPC for tool cloning' }
  }

  async pullTool(_slug: string): Promise<ApiResponse<Tool>> {
    return { success: false, data: null, error: 'Use gRPC for tool pull' }
  }

  // Builtin tools (forwarded to agent via gRPC)
  async listBuiltinTools(_agent?: string): Promise<ApiResponse<{ tools: { name: string; description: string; parameters: Record<string, unknown> }[] }>> {
    return { success: true, data: { tools: [] }, error: null }
  }

  async executeBuiltinTool(_agent?: string, _toolName?: string, _args?: Record<string, unknown>, _sessionId?: string): Promise<ApiResponse<{ title: string; output: string; metadata: Record<string, unknown>; attachments?: { mime: string; url: string }[]; truncated: boolean }>> {
    return { success: false, data: null, error: 'Use gRPC for builtin tool execution' }
  }

  // Forgejo/Git methods
  async listForgejoUsers(): Promise<ApiResponse<ForgejoUser[]>> {
    return { success: true, data: [], error: null }
  }

  async createForgejoUser(_req: { username: string; password: string }): Promise<ApiResponse<ForgejoUser>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async deleteForgejoUser(_username: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async bindForgejoUser(_agent: string, _forgejoUser: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async unbindForgejoUser(_agent: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async listGitRepos(_owner?: string): Promise<ApiResponse<GitRepository[]>> {
    return { success: true, data: [], error: null }
  }

  async getGitRepo(_owner: string, _repo: string): Promise<ApiResponse<GitRepository>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async createGitRepo(_req: { name: string; description?: string }): Promise<ApiResponse<GitRepository>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async deleteGitRepo(_owner: string, _repo: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async updateGitRepo(_owner: string, _repo: string, _req: { private?: boolean; description?: string }): Promise<ApiResponse<GitRepository>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async transferGitRepo(_owner: string, _repo: string, _newOwner: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async listCollaborators(_owner: string, _repo: string): Promise<ApiResponse<Collaborator[]>> {
    return { success: true, data: [], error: null }
  }

  async addCollaborator(_owner: string, _repo: string, _req: { username: string; permission?: string }): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async removeCollaborator(_owner: string, _repo: string, _username: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async listOrgs(): Promise<ApiResponse<Organization[]>> {
    return { success: true, data: [], error: null }
  }

  async createOrg(_req: { name: string }): Promise<ApiResponse<Organization>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async deleteOrg(_org: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async listOrgMembers(_org: string): Promise<ApiResponse<OrgMember[]>> {
    return { success: true, data: [], error: null }
  }

  async addOrgMember(_org: string, _username: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async removeOrgMember(_org: string, _username: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  // Session methods (use gRPC for real-time features)
  async listSessions(_agent?: string): Promise<ApiResponse<{ sessions: Session[]; total: number }>> {
    return { success: true, data: { sessions: [], total: 0 }, error: null }
  }

  async getSessionMessages(_agent?: string, _sessionId?: string): Promise<ApiResponse<{ messages: Message[]; total: number }>> {
    return { success: true, data: { messages: [], total: 0 }, error: null }
  }

  async sendSessionChat(_agent?: string, _sessionId?: string, _content?: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async sendSessionInterrupt(_agent?: string, _sessionId?: string, _message?: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  // Process methods
  async listProcesses(_agent?: string): Promise<ApiResponse<{ processes: Process[]; total: number }>> {
    return { success: true, data: { processes: [], total: 0 }, error: null }
  }

  async getProcessOutput(_agent?: string, _processId?: string): Promise<ApiResponse<{ content: string; total_size: number }>> {
    return { success: true, data: { content: '', total_size: 0 }, error: null }
  }

  // Task methods
  async listTasks(_agent?: string): Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    return { success: true, data: { tasks: [], total: 0 }, error: null }
  }

  // Activity methods
  async listActivities(_agent?: string): Promise<ApiResponse<{ activities: Activity[]; total: number }>> {
    return { success: true, data: { activities: [], total: 0 }, error: null }
  }

  // File methods
  async listFiles(_agent?: string): Promise<ApiResponse<FileInfo[]>> {
    return { success: true, data: [], error: null }
  }

  async getFile(_agent?: string, _path?: string): Promise<ApiResponse<FileResponse>> {
    return { success: false, data: null, error: 'Not implemented' }
  }

  async updateFile(_agent?: string, _path?: string, _content?: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  // Message methods
  async sendMessage(_agent?: string, _content?: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }

  async sendRemind(_agent?: string, _message?: string): Promise<ApiResponse<void>> {
    return { success: true, data: null, error: null }
  }
}

let apiInstance: ApiClient | null = null

export function getApi(): ApiClient {
  if (!apiInstance) {
    apiInstance = new ApiClient()
  }
  return apiInstance
}

export const api = new ApiClient()
export default api