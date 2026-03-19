import { Message, Session, Process, Task, Activity } from '@/lib/types'

interface GrpcConfig {
  baseUrl: string
}

interface GrpcRequest {
  method: string
  params?: Record<string, unknown>
}

interface GrpcResponse<T> {
  result?: T
  error?: { code: number; message: string }
}

export class GrpcClient {
  private config: GrpcConfig

  constructor(baseUrl?: string) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      this.config = {
        baseUrl: baseUrl || `${hostname}:17532`,
      }
    } else {
      this.config = { baseUrl: baseUrl || 'localhost:17532' }
    }
  }

  private async call<T>(service: string, method: string, request: unknown): Promise<T> {
    const response = await fetch(`http://${this.config.baseUrl}/${service}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+json',
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`gRPC call failed: ${response.status}`)
    }
    
    const text = await response.text()
    return JSON.parse(text)
  }

  // Session methods (forwarded to agent via gRPC)
  async listSessions(agent: string): Promise<{ sessions: Session[]; total: number }> {
    return this.call('swarm.SwarmService', 'ListSessions', { agent })
  }

  async getSessionMessages(agent: string, sessionId: string): Promise<{ messages: Message[]; total: number }> {
    return this.call('swarm.SwarmService', 'GetSessionMessages', { agent, session_id: sessionId })
  }

  async sendSessionChat(agent: string, sessionId: string, content: string): Promise<void> {
    return this.call('swarm.SwarmService', 'SendSessionChat', { agent, session_id: sessionId, content })
  }

  async interruptSession(agent: string, sessionId: string, message: string): Promise<void> {
    return this.call('swarm.SwarmService', 'InterruptSession', { agent, session_id: sessionId, message })
  }

  // Process methods
  async listProcesses(agent: string): Promise<{ processes: Process[]; total: number }> {
    return this.call('swarm.SwarmService', 'ListProcesses', { agent })
  }

  async getProcessOutput(agent: string, processId: string): Promise<{ content: string; total_size: number }> {
    return this.call('swarm.SwarmService', 'GetProcessOutput', { agent, process_id: processId })
  }

  // Task methods
  async listTasks(agent: string): Promise<{ tasks: Task[]; total: number }> {
    return this.call('swarm.SwarmService', 'ListTasks', { agent })
  }

  // Activity methods
  async listActivities(agent: string): Promise<{ activities: Activity[]; total: number }> {
    return this.call('swarm.SwarmService', 'ListActivities', { agent })
  }
}

let grpcInstance: GrpcClient | null = null

export function getGrpcClient(): GrpcClient {
  if (!grpcInstance) {
    grpcInstance = new GrpcClient()
  }
  return grpcInstance
}

export default GrpcClient