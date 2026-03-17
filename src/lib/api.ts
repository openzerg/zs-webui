import { ApiResponse, Agent, StatsSummary, TokenUsage, CreateAgentRequest, ForgejoUser, Provider, ApiKey, CreateForgejoUserRequest, CreateProviderRequest, CreateApiKeyRequest, CreateApiKeyResponse, GitRepository, Collaborator, Organization, OrgMember, CreateRepoRequest, UpdateRepoRequest, TransferRepoRequest, AddCollaboratorRequest, CreateOrgRequest } from './types'

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

  async getAgentStats(name: string): Promise<ApiResponse<TokenUsage[]>> {
    return this.fetch<TokenUsage[]>(`/api/agents/${name}/stats`)
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

  async createApiKey(data: CreateApiKeyRequest): Promise<ApiResponse<CreateApiKeyResponse>> {
    return this.fetch<CreateApiKeyResponse>('/api/llm/keys', {
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
}

export const api = new ApiClient()