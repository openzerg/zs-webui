export interface Agent {
  name: string
  enabled: boolean
  container_ip: string
  host_ip: string
  forgejo_username: string | null
  online: boolean
  model_id: string | null
  model_name: string | null
  internal_token: string
}

export interface Checkpoint {
  id: string
  agent_name: string
  description: string
  created_at: string
  btrfs_snapshot: string
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

export interface Model {
  id: string
  name: string
  provider_id: string
  provider_name: string
  model_name: string
  enabled: boolean
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

export interface CreateModelRequest {
  name: string
  provider_id: string
  model_name: string
}

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

export interface CreateOrgRequest {
  name: string
}

export interface CreateCheckpointRequest {
  description?: string
}

export interface RollbackRequest {
  checkpoint_id: string
}

export interface CloneCheckpointRequest {
  new_name: string
}

export interface Tool {
  slug: string
  name: string
  version: string
  description: string
  forgejo_repo: string
  git_commit: string
  entrypoint: string
  input_schema: Record<string, unknown> | null
  output_schema: Record<string, unknown> | null
  author_agent: string
  allowed_agents: string[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateToolRequest {
  slug: string
  author_agent: string
  forgejo_repo: string
}

export interface InvokeToolRequest {
  input: Record<string, unknown>
}

export interface InvokeToolResponse {
  success: boolean
  output: Record<string, unknown> | null
  error: string | null
}

export interface SetEnvRequest {
  key: string
  value: string
}

export interface AuthorizeRequest {
  agent_name: string
}

export interface Skill {
  slug: string
  name: string
  version: string
  description: string
  forgejo_repo: string
  git_commit: string
  author_agent: string
  created_at: string
  updated_at: string
}

export interface CreateSkillRequest {
  slug: string
  author_agent: string
  forgejo_repo: string
}

export interface UploadFileRequest {
  filename: string
  content: string
}

export interface FileInfo {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: string | null
}

export interface FileContent {
  path: string
  content: string
  size: number
}

export type FileResponse = FileInfo[] | FileContent

export interface SendEventRequest {
  event_type: 'interrupt' | 'message' | 'assign_task' | 'remind'
  data: Record<string, unknown>
}

export interface QueryRequest {
  question: string
}

export interface Session {
  id: string
  purpose: string
  state: string
  created_at: string
  started_at?: string
  finished_at?: string
  message_count: number
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  tool_calls?: ToolCallData[]
}

export interface ToolCallData {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: Record<string, unknown>
}

export interface Process {
  id: string
  command: string
  args: string[]
  cwd: string
  status: string
  exit_code?: number
  started_at: string
  finished_at?: string
  session_id: string
  stdout_size: number
  stderr_size: number
}

export interface Activity {
  id: string
  session_id?: string
  activity_type: string
  description: string
  details: Record<string, unknown>
  timestamp: string
}

export interface Task {
  id: string
  content: string
  status: string
  priority: string
  session_id?: string
  created_at: string
  updated_at: string
}

export interface BuiltinTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolExecutionResult {
  title: string
  output: string
  metadata: Record<string, unknown>
  attachments?: {
    mime: string
    url: string
  }[]
  truncated: boolean
}

export interface ExecuteToolRequest {
  tool_name: string
  args: Record<string, unknown>
  session_id?: string
}

export interface StoredToolResult {
  tool_call_id: string
  output: string
  success: boolean
}