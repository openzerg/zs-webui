import { ApiResponse, Agent, StatsSummary, CreateAgentRequest, ForgejoUser, Provider, ApiKey, CreateForgejoUserRequest, CreateProviderRequest, CreateApiKeyRequest, GitRepository, Collaborator, Organization, OrgMember, CreateRepoRequest, UpdateRepoRequest, TransferRepoRequest, AddCollaboratorRequest, CreateOrgRequest, Checkpoint, CreateCheckpointRequest, CloneCheckpointRequest, Skill, CreateSkillRequest, InvokeSkillRequest, InvokeSkillResponse, SetSecretRequest, UploadFileRequest, AuthorizeRequest } from './types'

class ApiClient {
  private baseUrl: string
  private authHeader: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.baseUrl = `${window.location.protocol}//${window.location.hostname}:17531`
      const auth = localStorage.getItem('auth')
      if (auth) {
        this.authHeader = 'Basic ' + auth
      }
    } else {
      this.baseUrl = ''
    }
  }

  setAuth(username: string, password: string) {
    const encoded = btoa(username + ':' + password)
    this.authHeader = 'Basic ' + encoded
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth', encoded)
    }
  }

  clearAuth() {
    this.authHeader = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth')
    }
  }

  isAuthenticated(): boolean {
    return this.authHeader !== null
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>
      Object.assign(headers, existingHeaders)
    }
    
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      this.clearAuth()
      throw new Error('Unauthorized')
    }

    const data = await response.json()
    return data
  }

  async listAgents(): Promise<ApiResponse<Agent[]>> {
    return this.fetch<Agent[]>('/api/agents')
  }

  async getAgent(name: string): Promise<ApiResponse<Agent>> {
    return this.fetch<Agent>(`/api/agents/${name}`)
  }

  async createAgent(data: CreateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.fetch<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/agents/${name}`, { method: 'DELETE' })
  }

  async enableAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/agents/${name}/enable`, { method: 'POST' })
  }

  async disableAgent(name: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/agents/${name}/disable`, { method: 'POST' })
  }

  async getStats(): Promise<ApiResponse<StatsSummary>> {
    return this.fetch<StatsSummary>('/api/stats/summary')
  }

  async listForgejoUsers(): Promise<ApiResponse<ForgejoUser[]>> {
    return this.fetch<ForgejoUser[]>('/api/git/users')
  }

  async createForgejoUser(data: CreateForgejoUserRequest): Promise<ApiResponse<ForgejoUser>> {
    return this.fetch<ForgejoUser>('/api/git/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteForgejoUser(username: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/users/${username}`, { method: 'DELETE' })
  }

  async bindForgejoUser(agent: string, forgejoUser: string): Promise<ApiResponse<null>> {
    return this.fetch<null>('/api/git/users/bind', {
      method: 'POST',
      body: JSON.stringify({ agent, forgejo_user: forgejoUser }),
    })
  }

  async unbindForgejoUser(agent: string): Promise<ApiResponse<null>> {
    return this.fetch<null>('/api/git/users/unbind', {
      method: 'POST',
      body: JSON.stringify({ agent }),
    })
  }

  async listProviders(): Promise<ApiResponse<Provider[]>> {
    return this.fetch<Provider[]>('/api/llm/providers')
  }

  async createProvider(data: CreateProviderRequest): Promise<ApiResponse<Provider>> {
    return this.fetch<Provider>('/api/llm/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/llm/providers/${id}`, { method: 'DELETE' })
  }

  async enableProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/llm/providers/${id}/enable`, { method: 'POST' })
  }

  async disableProvider(id: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/llm/providers/${id}/disable`, { method: 'POST' })
  }

  async listApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.fetch<ApiKey[]>('/api/llm/keys')
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiResponse<string>> {
    return this.fetch<string>('/api/llm/keys', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteApiKey(id: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/llm/keys/${id}`, { method: 'DELETE' })
  }

  // Git Repo
  async listGitRepos(owner?: string): Promise<ApiResponse<GitRepository[]>> {
    const query = owner ? `?owner=${owner}` : ''
    return this.fetch<GitRepository[]>(`/api/git/repos${query}`)
  }

  async getGitRepo(owner: string, repo: string): Promise<ApiResponse<GitRepository>> {
    return this.fetch<GitRepository>(`/api/git/repos/${owner}/${repo}`)
  }

  async createGitRepo(data: CreateRepoRequest): Promise<ApiResponse<GitRepository>> {
    return this.fetch<GitRepository>('/api/git/repos', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteGitRepo(owner: string, repo: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/repos/${owner}/${repo}`, { method: 'DELETE' })
  }

  async updateGitRepo(owner: string, repo: string, data: UpdateRepoRequest): Promise<ApiResponse<GitRepository>> {
    return this.fetch<GitRepository>(`/api/git/repos/${owner}/${repo}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async transferGitRepo(owner: string, repo: string, newOwner: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/repos/${owner}/${repo}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ new_owner: newOwner }),
    })
  }

  // Git Collaborators
  async listCollaborators(owner: string, repo: string): Promise<ApiResponse<Collaborator[]>> {
    return this.fetch<Collaborator[]>(`/api/git/repos/${owner}/${repo}/collaborators`)
  }

  async addCollaborator(owner: string, repo: string, data: AddCollaboratorRequest): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/repos/${owner}/${repo}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async removeCollaborator(owner: string, repo: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/repos/${owner}/${repo}/collaborators/${username}`, { method: 'DELETE' })
  }

  // Git Organizations
  async listOrgs(): Promise<ApiResponse<Organization[]>> {
    return this.fetch<Organization[]>('/api/git/orgs')
  }

  async createOrg(data: CreateOrgRequest): Promise<ApiResponse<Organization>> {
    return this.fetch<Organization>('/api/git/orgs', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteOrg(org: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/orgs/${org}`, { method: 'DELETE' })
  }

  async listOrgMembers(org: string): Promise<ApiResponse<OrgMember[]>> {
    return this.fetch<OrgMember[]>(`/api/git/orgs/${org}/members`)
  }

  async addOrgMember(org: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/orgs/${org}/members/${username}`, { method: 'POST' })
  }

  async removeOrgMember(org: string, username: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/git/orgs/${org}/members/${username}`, { method: 'DELETE' })
  }

  // Checkpoints
  async createCheckpoint(agentName: string, description?: string): Promise<ApiResponse<Checkpoint>> {
    return this.fetch<Checkpoint>(`/api/agents/${agentName}/checkpoint`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    })
  }

  async listCheckpoints(agentName: string): Promise<ApiResponse<Checkpoint[]>> {
    return this.fetch<Checkpoint[]>(`/api/agents/${agentName}/checkpoints`)
  }

  async rollbackAgent(agentName: string, checkpointId: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/agents/${agentName}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ checkpoint_id: checkpointId }),
    })
  }

  async deleteCheckpoint(checkpointId: string): Promise<ApiResponse<null>> {
    return this.fetch<null>(`/api/checkpoints/${checkpointId}`, { method: 'DELETE' })
  }

  async cloneCheckpoint(checkpointId: string, newName: string): Promise<ApiResponse<Agent>> {
    return this.fetch<Agent>(`/api/checkpoints/${checkpointId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    })
  }

  async listAllCheckpoints(): Promise<ApiResponse<Checkpoint[]>> {
    return this.fetch<Checkpoint[]>('/api/checkpoints')
  }

  // Skills
  async listSkills(): Promise<ApiResponse<Skill[]>> {
    return this.fetch<Skill[]>('/api/skills')
  }

  async getSkill(id: string): Promise<ApiResponse<Skill>> {
    return this.fetch<Skill>(`/api/skills/${id}`)
  }

  async createSkill(data: CreateSkillRequest): Promise<ApiResponse<Skill>> {
    return this.fetch<Skill>('/api/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteSkill(id: string): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${id}`, { method: 'DELETE' })
  }

  async setSkillSecret(skillId: string, data: SetSecretRequest): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${skillId}/secrets`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async listSkillSecrets(skillId: string): Promise<ApiResponse<string[]>> {
    return this.fetch<string[]>(`/api/skills/${skillId}/secrets`)
  }

  async deleteSkillSecret(skillId: string, key: string): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${skillId}/secrets/${key}`, { method: 'DELETE' })
  }

  async authorizeSkill(skillId: string, data: AuthorizeRequest): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${skillId}/authorize`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async revokeSkill(skillId: string, data: AuthorizeRequest): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${skillId}/revoke`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async uploadSkillFile(skillId: string, data: UploadFileRequest): Promise<ApiResponse<string>> {
    return this.fetch<string>(`/api/skills/${skillId}/files`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async invokeSkill(skillId: string, data: InvokeSkillRequest): Promise<ApiResponse<InvokeSkillResponse>> {
    return this.fetch<InvokeSkillResponse>(`/api/skills/${skillId}/invoke`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient()