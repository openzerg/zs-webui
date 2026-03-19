import { useEffect, useRef, useCallback } from 'react'

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number = 10000,
  enabled: boolean = true
) {
  const savedCallback = useRef(fetchFn)
  
  useEffect(() => {
    savedCallback.current = fetchFn
  }, [fetchFn])
  
  useEffect(() => {
    if (!enabled) return
    
    const tick = async () => {
      try {
        await savedCallback.current()
      } catch (e) {
        console.error('Polling error:', e)
      }
    }
    
    tick()
    
    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}

export function useAgentPolling(
  agentName: string | null,
  onUpdate: (data: unknown) => void,
  interval: number = 10000
) {
  const poll = useCallback(async () => {
    if (!agentName) return
    // TODO: Implement gRPC-Web call to fetch agent session/process data
    // For now, this is a placeholder
    console.log('Polling agent:', agentName)
  }, [agentName])
  
  usePolling(poll, interval, !!agentName)
}

export function useSessionPolling(
  agentName: string | null,
  sessionId: string | null,
  onUpdate: (messages: unknown[]) => void,
  interval: number = 5000
) {
  const poll = useCallback(async () => {
    if (!agentName || !sessionId) return
    // TODO: Implement gRPC-Web call to fetch session messages
    console.log('Polling session:', agentName, sessionId)
  }, [agentName, sessionId])
  
  usePolling(poll, interval, !!agentName && !!sessionId)
}