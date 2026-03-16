export interface Agent {
  name: string
  enabled: boolean
  http_port: number
  container_ip: string
  host_ip: string
  forgejo_username: string | null
  online: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface StatsSummary {
  total_agents: number
  enabled_agents: number
  online_agents: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost: number
}

export interface TokenUsage {
  id: number
  agent_name: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  cost: number
  timestamp: string
}

export interface AgentEvent {
  event: 'connected' | 'disconnected' | 'status_update' | 'created' | 'deleted' | 'enabled' | 'disabled'
  agent_name: string
  timestamp: string
  data: Record<string, unknown> | null
}

export interface CreateAgentRequest {
  name: string
  forgejo_username?: string
}

export interface ForgejoUser {
  username: string
  email: string
  created_at: string
}

export interface Provider {
  id: string
  name: string
  provider_type: string
  base_url: string
  enabled: boolean
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  provider_id: string
  created_at: string
}

export interface CreateForgejoUserRequest {
  username: string
  password: string
}

export interface CreateProviderRequest {
  name: string
  provider_type: string
  base_url: string
  api_key: string
}

export interface CreateApiKeyRequest {
  name: string
  provider_id: string
}

export interface CreateApiKeyResponse {
  id: string
  name: string
  key: string
  provider_id: string
  provider_name: string
  created_at: string
}

// Git types
export interface GitRepository {
  id: number
  name: string
  full_name: string
  owner: { login: string; full_name: string }
  description: string
  private: boolean
  html_url: string
  ssh_url: string
  clone_url: string
  stars_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  created_at: string
  updated_at: string
}

export interface Collaborator {
  id: number
  login: string
  full_name: string
  permissions: { admin: boolean; push: boolean; pull: boolean }
}

export interface Branch {
  name: string
  commit: { id: string; message: string }
  protected: boolean
}

export interface Organization {
  id: number
  login: string
  full_name: string
  description: string
}

export interface OrgMember {
  id: number
  login: string
  full_name: string
}

export interface AccessToken {
  id: number
  name: string
  sha1: string
  token_last_eight: string
  scopes: string[]
}

export interface CreateRepoRequest {
  name: string
  description?: string
}

export interface UpdateRepoRequest {
  private?: boolean
  description?: string
}

export interface TransferRepoRequest {
  new_owner: string
}

export interface AddCollaboratorRequest {
  username: string
  permission?: string
}

export interface CreateBranchRequest {
  branch: string
  reference?: string
}

export interface CreateOrgRequest {
  name: string
}

export interface CreateTokenRequest {
  username: string
  name: string
  scopes?: string[]
}