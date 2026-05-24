import { AuditLog } from '../models/types';

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  log(auditLog: AuditLog): void {
    this.logs.push(auditLog);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (process.env.NODE_ENV !== 'test') {
      this.writeToConsole(auditLog);
    }
  }

  private writeToConsole(log: AuditLog): void {
    const logEntry = {
      timestamp: log.timestamp.toISOString(),
      agent: log.agentName,
      success: log.success,
      duration: `${log.duration}ms`,
      ...(log.error && { error: log.error }),
    };

    if (log.success) {
      console.log('[AUDIT]', JSON.stringify(logEntry));
    } else {
      console.error('[AUDIT ERROR]', JSON.stringify(logEntry));
    }
  }

  getLogs(agentName?: string): AuditLog[] {
    if (agentName) {
      return this.logs.filter((log) => log.agentName === agentName);
    }
    return [...this.logs];
  }

  getRecentLogs(count: number = 10): AuditLog[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getSuccessRate(agentName?: string): number {
    const relevantLogs = agentName
      ? this.logs.filter((log) => log.agentName === agentName)
      : this.logs;

    if (relevantLogs.length === 0) return 0;

    const successCount = relevantLogs.filter((log) => log.success).length;
    return successCount / relevantLogs.length;
  }

  getAverageDuration(agentName?: string): number {
    const relevantLogs = agentName
      ? this.logs.filter((log) => log.agentName === agentName)
      : this.logs;

    if (relevantLogs.length === 0) return 0;

    const totalDuration = relevantLogs.reduce((sum, log) => sum + log.duration, 0);
    return totalDuration / relevantLogs.length;
  }
}

export const globalAuditLogger = new AuditLogger();
