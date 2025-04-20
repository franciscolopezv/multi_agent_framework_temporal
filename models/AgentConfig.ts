export interface AgentConfig {
    agentId: string;
    description?: string;
    prompt: string;
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude' | string;
    endpoint?: string; // Optional external service
    headers?: Record<string, string>; // For API auth
    createdAt: string;
  }