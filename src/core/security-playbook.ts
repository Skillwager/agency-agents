import { SecurityPlaybook } from '../models/types';

export class SecurityPlaybookEnforcer {
  private playbook: SecurityPlaybook;

  constructor(playbook: SecurityPlaybook) {
    this.playbook = playbook;
  }

  validateAndSanitizeInput<T>(input: T): T {
    if (!this.playbook.enforceInputValidation) {
      return input;
    }

    if (this.playbook.sanitizeUserInput && typeof input === 'object' && input !== null) {
      return this.sanitizeObject(input);
    }

    return input;
  }

  validateOutput<T>(output: T): T {
    if (!this.playbook.enforceOutputValidation) {
      return output;
    }

    if (this.playbook.blockSensitiveData && typeof output === 'object' && output !== null) {
      return this.removeSensitiveData(output);
    }

    return output;
  }

  private sanitizeObject<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as T;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .trim();
  }

  private removeSensitiveData<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeSensitiveData(item)) as T;
    }

    const cleaned: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'apiKey', 'secret', 'token', 'ssn', 'creditCard'];

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.removeSensitiveData(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned as T;
  }

  checkRateLimit(_agentName: string, requestCount: number): boolean {
    if (!this.playbook.rateLimiting) {
      return true;
    }

    return requestCount <= this.playbook.rateLimiting.maxRequestsPerMinute;
  }
}

export const defaultSecurityPlaybook: SecurityPlaybook = {
  enforceInputValidation: true,
  enforceOutputValidation: true,
  sanitizeUserInput: true,
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
  },
  blockSensitiveData: true,
};
