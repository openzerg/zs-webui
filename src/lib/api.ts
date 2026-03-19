import { ApiResponse, Session, Message, Process, Activity, Task, FileInfo, FileContent, FileResponse, ForgejoUser, Provider, ApiKey, GitRepository, Collaborator, Organization, OrgMember, Tool, Skill, Checkpoint } from './types'

export type ApiMode = 'swarm' | 'agent'

interface ApiConfig {
  mode: ApiMode
  baseUrl: string
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

function getDefaultBaseUrl(mode: ApiMode): string {
  if (!isBrowser) return ''
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  return mode === 'swarm' 
    ? `${protocol}//${hostname}:17531` 
    : `${protocol}//${hostname}:8081`
}

class ApiClient {
  private config: ApiConfig

  constructor() {
    const mode = getBuildMode()
    this.config = {
      mode,
      baseUrl: getDefaultBaseUrl(mode),
      token: isBrowser ? localStorage.getItem('auth') : null,
    }
  }

  get mode() { return this.config.mode }
  get baseUrl() { return this.config.baseUrl }

  setToken(token: string | null) {
    this.config.token = token
    if (isBrowser) {
      if (token) localStorage.setItem('auth', token)
      else localStorage.removeItem('auth')
    }
  }
  
  setAuth(token: string) { this.setToken(token) }

  getToken() { return this.config.token }

  isAuthenticated(): boolean {
    return this.config.mode === 'agent' || this.config.token !== null
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
    })

    if (response.status === 401) {
      this.setToken(null)
      throw new Error('Unauthorized')
    }

    return response.json()
  }

  // ============ Auth ============
  
  async login(token: string): Promise<boolean> {
    this.setToken(token)
    try {
      const result = await this.listAgents()
      if (result.success) return true
      this.setToken(null)
      return false
    } catch {
      this.setToken(null)
      return false
    }
  }

  logout() { this.setToken(null) }
  
  clearAuth() { this.setToken(null) }

  // ============ Swarm APIs ============

  async listAgents(): Promise<ApiResponse<{ name: string; enabled: boolean; container_ip: string; host_ip: string; forgejo_username: string | null; online: boolean }[]>> {
    return this.fetch('/api/agents')
  }

  async createAgent(name: string, forgejoUsername?: string): Promise<ApiResponse<unknown>> {
    return this.fetch('/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name, forgejo_username: forgejoUsername }),
    })
  }

  async deleteAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/agents/${name}`, { method: 'DELETE' })
  }

  async enableAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/agents/${name}/enable`, { method: 'POST' })
  }

  async disableAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/agents/${name}/disable`, { method: 'POST' })
  }

  async getStats(): Promise<ApiResponse<{ total_agents: number; enabled_agents: number; online_agents: number }>> {
    return this.fetch('/api/stats/summary')
  }

  // Forgejo Users
  async listForgejoUsers(): Promise<ApiResponse<ForgejoUser[]>> {
    return this.fetch('/api/git/users')
  }

  async createForgejoUser(data: { username: string; password: string }): Promise<ApiResponse<ForgejoUser>> {
    return this.fetch('/api/git/users', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteForgejoUser(username: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/users/${username}`, { method: 'DELETE' })
  }

  async bindForgejoUser(agent: string, forgejoUser: string): Promise<ApiResponse<null>> {
    return this.fetch('/api/git/users/bind', { method: 'POST', body: JSON.stringify({ agent, forgejo_user: forgejoUser }) })
  }

  async unbindForgejoUser(agent: string): Promise<ApiResponse<null>> {
    return this.fetch('/api/git/users/unbind', { method: 'POST', body: JSON.stringify({ agent }) })
  }

  // LLM Providers
  async listProviders(): Promise<ApiResponse<Provider[]>> {
    return this.fetch('/api/llm/providers')
  }

  async createProvider(data: { name: string; provider_type: string; base_url: string; api_key: string }): Promise<ApiResponse<Provider>> {
    return this.fetch('/api/llm/providers', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/llm/providers/${id}`, { method: 'DELETE' })
  }

  async enableProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/llm/providers/${id}/enable`, { method: 'POST' })
  }

  async disableProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/llm/providers/${id}/disable`, { method: 'POST' })
  }

  async listApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.fetch('/api/llm/keys')
  }

  async createApiKey(data: { name: string; provider_id: string }): Promise<ApiResponse<{ id: string; name: string; key: string; provider_id: string; created_at: string }>> {
    return this.fetch('/api/llm/keys', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteApiKey(id: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/llm/keys/${id}`, { method: 'DELETE' })
  }

  // Git Repos
  async listGitRepos(owner?: string): Promise<ApiResponse<GitRepository[]>> {
    const query = owner ? `?owner=${owner}` : ''
    return this.fetch(`/api/git/repos${query}`)
  }

  async getGitRepo(owner: string, repo: string): Promise<ApiResponse<GitRepository>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}`)
  }

  async createGitRepo(data: { name: string; description?: string }): Promise<ApiResponse<GitRepository>> {
    return this.fetch('/api/git/repos', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteGitRepo(owner: string, repo: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}`, { method: 'DELETE' })
  }

  async updateGitRepo(owner: string, repo: string, data: { private?: boolean; description?: string }): Promise<ApiResponse<GitRepository>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async transferGitRepo(owner: string, repo: string, newOwner: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}/transfer`, { method: 'POST', body: JSON.stringify({ new_owner: newOwner }) })
  }

  // Collaborators
  async listCollaborators(owner: string, repo: string): Promise<ApiResponse<Collaborator[]>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}/collaborators`)
  }

  async addCollaborator(owner: string, repo: string, data: { username: string; permission?: string }): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}/collaborators`, { method: 'POST', body: JSON.stringify(data) })
  }

  async removeCollaborator(owner: string, repo: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/repos/${owner}/${repo}/collaborators/${username}`, { method: 'DELETE' })
  }

  // Organizations
  async listOrgs(): Promise<ApiResponse<Organization[]>> {
    return this.fetch('/api/git/orgs')
  }

  async createOrg(data: { name: string }): Promise<ApiResponse<Organization>> {
    return this.fetch('/api/git/orgs', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteOrg(org: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/orgs/${org}`, { method: 'DELETE' })
  }

  async listOrgMembers(org: string): Promise<ApiResponse<OrgMember[]>> {
    return this.fetch(`/api/git/orgs/${org}/members`)
  }

  async addOrgMember(org: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/orgs/${org}/members/${username}`, { method: 'POST' })
  }

  async removeOrgMember(org: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/git/orgs/${org}/members/${username}`, { method: 'DELETE' })
  }

  // Checkpoints
  async listCheckpoints(agentName: string): Promise<ApiResponse<Checkpoint[]>> {
    return this.fetch(`/api/agents/${agentName}/checkpoints`)
  }

  async createCheckpoint(agentName: string, description?: string): Promise<ApiResponse<Checkpoint>> {
    return this.fetch(`/api/agents/${agentName}/checkpoint`, { method: 'POST', body: JSON.stringify({ description }) })
  }

  async rollbackAgent(agentName: string, checkpointId: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/agents/${agentName}/rollback`, { method: 'POST', body: JSON.stringify({ checkpoint_id: checkpointId }) })
  }

  async deleteCheckpoint(checkpointId: string): Promise<ApiResponse<null>> {
    return this.fetch(`/api/checkpoints/${checkpointId}`, { method: 'DELETE' })
  }

  async cloneCheckpoint(checkpointId: string, newName: string): Promise<ApiResponse<{ name: string; enabled: boolean; container_ip: string; host_ip: string; forgejo_username: string | null; online: boolean }>> {
    return this.fetch(`/api/checkpoints/${checkpointId}/clone`, { method: 'POST', body: JSON.stringify({ new_name: newName }) })
  }

  async listAllCheckpoints(): Promise<ApiResponse<Checkpoint[]>> {
    return this.fetch('/api/checkpoints')
  }

  // Tools
  async listTools(): Promise<ApiResponse<Tool[]>> {
    return this.fetch('/api/tools')
  }

  async getTool(slug: string): Promise<ApiResponse<Tool>> {
    return this.fetch(`/api/tools/${slug}`)
  }

  async createTool(data: { slug: string; author_agent: string; forgejo_repo: string }): Promise<ApiResponse<Tool>> {
    return this.fetch('/api/tools', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteTool(slug: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/tools/${slug}`, { method: 'DELETE' })
  }

  async pullTool(slug: string): Promise<ApiResponse<Tool>> {
    return this.fetch(`/api/tools/${slug}/pull`, { method: 'POST' })
  }

  async authorizeTool(slug: string, agentName: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/tools/${slug}/authorize`, { method: 'POST', body: JSON.stringify({ agent_name: agentName }) })
  }

  async revokeTool(slug: string, agentName: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/tools/${slug}/revoke`, { method: 'POST', body: JSON.stringify({ agent_name: agentName }) })
  }

  async invokeTool(slug: string, input: Record<string, unknown>): Promise<ApiResponse<{ success: boolean; output: Record<string, unknown> | null; error: string | null }>> {
    return this.fetch(`/api/tools/${slug}/invoke`, { method: 'POST', body: JSON.stringify({ input }) })
  }

  async listToolEnv(slug: string): Promise<ApiResponse<string[]>> {
    return this.fetch(`/api/tools/${slug}/env`)
  }

  async setToolEnv(slug: string, key: string, value: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/tools/${slug}/env`, { method: 'POST', body: JSON.stringify({ key, value }) })
  }

  async deleteToolEnv(slug: string, key: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/tools/${slug}/env/${key}`, { method: 'DELETE' })
  }

  // Skills
  async listSkills(): Promise<ApiResponse<Skill[]>> {
    return this.fetch('/api/skills')
  }

  async getSkill(slug: string): Promise<ApiResponse<Skill>> {
    return this.fetch(`/api/skills/${slug}`)
  }

  async createSkill(data: { slug: string; author_agent: string; forgejo_repo: string }): Promise<ApiResponse<Skill>> {
    return this.fetch('/api/skills', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteSkill(slug: string): Promise<ApiResponse<string>> {
    return this.fetch(`/api/skills/${slug}`, { method: 'DELETE' })
  }

  async pullSkill(slug: string): Promise<ApiResponse<Skill>> {
    return this.fetch(`/api/skills/${slug}/pull`, { method: 'POST' })
  }

  // ============ Agent APIs ============

  private agentPrefix(agentName?: string): string {
    return this.config.mode === 'agent' ? '' : `/api/agents/${agentName || 'default'}`
  }

  async listSessions(agentName?: string): Promise<ApiResponse<{ sessions: Session[]; total: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/sessions`)
  }

  async getSessionMessages(agentName: string | undefined, sessionId: string): Promise<ApiResponse<{ messages: Message[]; total: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/sessions/${sessionId}/messages`)
  }

  async sendSessionChat(agentName: string | undefined, sessionId: string, content: string): Promise<ApiResponse<{ session_id: string }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/sessions/${sessionId}/chat`, { method: 'POST', body: JSON.stringify({ content }) })
  }

  async sendSessionInterrupt(agentName: string | undefined, sessionId: string, message: string): Promise<ApiResponse<{ interrupted: boolean }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/sessions/${sessionId}/interrupt`, { method: 'POST', body: JSON.stringify({ message }) })
  }

  async listProcesses(agentName?: string): Promise<ApiResponse<{ processes: Process[]; total: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/processes`)
  }

  async getProcessOutput(agentName: string | undefined, processId: string, stream = 'stdout'): Promise<ApiResponse<{ content: string; total_size: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/processes/${processId}/output?stream=${stream}`)
  }

  async listTasks(agentName?: string): Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/tasks`)
  }

  async listActivities(agentName?: string): Promise<ApiResponse<{ activities: Activity[]; total: number }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/activities`)
  }

  async listFiles(agentName?: string): Promise<ApiResponse<FileInfo[]>> {
    return this.fetch(`${this.agentPrefix(agentName)}/files`)
  }

  async getFile(agentName: string | undefined, path: string): Promise<ApiResponse<FileResponse>> {
    return this.fetch(`${this.agentPrefix(agentName)}/files/${path}`)
  }

  async updateFile(agentName: string | undefined, path: string, content: string): Promise<ApiResponse<string>> {
    return this.fetch(`${this.agentPrefix(agentName)}/files/${path}`, { method: 'PUT', body: JSON.stringify({ content }) })
  }

  async sendMessage(agentName: string | undefined, content: string): Promise<ApiResponse<{ sent: boolean }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/message`, { method: 'POST', body: JSON.stringify({ content }) })
  }

  async sendRemind(agentName: string | undefined, message: string): Promise<ApiResponse<{ sent: boolean }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/remind`, { method: 'POST', body: JSON.stringify({ message }) })
  }

  // Builtin Tools
  async listBuiltinTools(agentName?: string): Promise<ApiResponse<{ tools: { name: string; description: string; parameters: Record<string, unknown> }[] }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/tools`)
  }

  async executeBuiltinTool(agentName: string | undefined, toolName: string, args: Record<string, unknown>, sessionId?: string): Promise<ApiResponse<{ title: string; output: string; metadata: Record<string, unknown>; attachments?: { mime: string; url: string }[]; truncated: boolean }>> {
    return this.fetch(`${this.agentPrefix(agentName)}/tools/${toolName}/execute`, { 
      method: 'POST', 
      body: JSON.stringify({ args, session_id: sessionId }) 
    })
  }

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
}

export const api = new ApiClient()