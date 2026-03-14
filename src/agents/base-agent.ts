import { z } from 'zod';
import {
  AgentConfig,
  AgentContext,
  AgentExecutionResult,
  AuditLog,
  AIServiceConfig,
  SecurityPlaybook,
  AgentMetrics,
  AgentStatus,
} from '../models/types';
import { AIService, AIMessage } from '../core/ai-service';
import { globalAuditLogger } from '../core/audit-logger';
import { SecurityPlaybookEnforcer, defaultSecurityPlaybook } from '../core/security-playbook';

export abstract class BaseAgent<TInput, TOutput> {
  protected config: AgentConfig;
  protected aiService: AIService;
  protected securityEnforcer: SecurityPlaybookEnforcer;
  protected status: AgentStatus = 'idle';
  protected metrics: AgentMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
  };

  abstract readonly inputSchema: z.ZodSchema<TInput>;
  abstract readonly outputSchema: z.ZodSchema<TOutput>;

  constructor(
    config: AgentConfig,
    aiConfig: AIServiceConfig,
    securityPlaybook: SecurityPlaybook = defaultSecurityPlaybook
  ) {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      model: 'gpt-4',
      ...config,
    };
    this.aiService = new AIService(aiConfig);
    this.securityEnforcer = new SecurityPlaybookEnforcer(securityPlaybook);
  }

  abstract getSystemPrompt(): string;

  abstract buildUserMessage(input: TInput): string;

  abstract parseAIResponse(response: string, input: TInput): TOutput;

  async execute(
    input: TInput,
    context?: AgentContext
  ): Promise<AgentExecutionResult<TOutput>> {
    const startTime = Date.now();
    const executionContext: AgentContext = {
      timestamp: new Date(),
      ...context,
    };

    this.status = 'running';

    try {
      const sanitizedInput = this.securityEnforcer.validateAndSanitizeInput(input);
      const validatedInput = this.inputSchema.parse(sanitizedInput);

      const output = await this.executeWithRetry(validatedInput, executionContext);

      const validatedOutput = this.outputSchema.parse(output);
      const sanitizedOutput = this.securityEnforcer.validateOutput(validatedOutput);

      const duration = Date.now() - startTime;
      this.status = 'success';
      this.updateMetrics(true, duration);

      const auditLog = this.createAuditLog(
        validatedInput,
        sanitizedOutput,
        true,
        duration,
        executionContext
      );

      globalAuditLogger.log(auditLog);

      return {
        success: true,
        data: sanitizedOutput,
        auditLog,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.status = 'error';
      this.updateMetrics(false, duration);

      const auditLog = this.createAuditLog(
        input,
        undefined,
        false,
        duration,
        executionContext,
        errorMessage
      );

      globalAuditLogger.log(auditLog);

      return {
        success: false,
        error: errorMessage,
        auditLog,
      };
    } finally {
      this.status = 'idle';
    }
  }

  private async executeWithRetry(
    input: TInput,
    context: AgentContext
  ): Promise<TOutput> {
    let lastError: Error | undefined;
    const maxRetries = this.config.maxRetries ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeCore(input, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Execution failed after retries');
  }

  private async executeCore(input: TInput, _context: AgentContext): Promise<TOutput> {
    const systemPrompt = this.getSystemPrompt();
    const userMessage = this.buildUserMessage(input);

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const response = await this.aiService.generateCompletion(messages, {
      model: this.config.model,
    });

    return this.parseAIResponse(response.content, input);
  }

  private createAuditLog(
    input: TInput,
    output: TOutput | undefined,
    success: boolean,
    duration: number,
    context: AgentContext,
    error?: string
  ): AuditLog {
    return {
      agentName: this.config.name,
      timestamp: new Date(),
      input,
      output,
      success,
      error,
      duration,
      context,
    };
  }

  private updateMetrics(success: boolean, duration: number): void {
    this.metrics.totalExecutions++;
    if (success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }

    const totalDuration =
      this.metrics.averageDuration * (this.metrics.totalExecutions - 1) + duration;
    this.metrics.averageDuration = totalDuration / this.metrics.totalExecutions;
    this.metrics.lastExecutionTime = new Date();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
