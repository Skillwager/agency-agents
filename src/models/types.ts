export interface AgentConfig {
  name: string;
  description: string;
  maxRetries?: number;
  timeout?: number;
  model?: string;
}

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  agentName: string;
  timestamp: Date;
  input: unknown;
  output: unknown;
  success: boolean;
  error?: string;
  duration: number;
  context?: AgentContext;
}

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface SecurityPlaybook {
  enforceInputValidation: boolean;
  enforceOutputValidation: boolean;
  sanitizeUserInput: boolean;
  rateLimiting?: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  allowedDomains?: string[];
  blockSensitiveData?: boolean;
}

export interface AgentExecutionResult<TOutput> {
  success: boolean;
  data?: TOutput;
  error?: string;
  auditLog: AuditLog;
}

export type AgentStatus = 'idle' | 'running' | 'success' | 'error';

export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutionTime?: Date;
}
