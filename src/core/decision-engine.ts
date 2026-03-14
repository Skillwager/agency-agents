import { AgentContext } from '../models/types';

export interface DecisionCriteria {
  priority: number;
  confidence: number;
  requiredFields: string[];
}

export interface DecisionOption<T = unknown> {
  id: string;
  action: T;
  criteria: DecisionCriteria;
  metadata?: Record<string, unknown>;
}

export interface DecisionResult<T = unknown> {
  selectedOption: DecisionOption<T>;
  reasoning: string;
  alternativeOptions: DecisionOption<T>[];
}

export class DecisionEngine {
  async makeDecision<T>(
    options: DecisionOption<T>[],
    context: AgentContext
  ): Promise<DecisionResult<T>> {
    if (options.length === 0) {
      throw new Error('No decision options provided');
    }

    const validOptions = options.filter((opt) =>
      this.validateOption(opt, context)
    );

    if (validOptions.length === 0) {
      throw new Error('No valid decision options available');
    }

    const sortedOptions = validOptions.sort((a, b) => {
      const scoreA = this.calculateScore(a, context);
      const scoreB = this.calculateScore(b, context);
      return scoreB - scoreA;
    });

    const selectedOption = sortedOptions[0];
    const alternativeOptions = sortedOptions.slice(1, 4);

    return {
      selectedOption,
      reasoning: this.generateReasoning(selectedOption, context),
      alternativeOptions,
    };
  }

  private validateOption<T>(
    option: DecisionOption<T>,
    context: AgentContext
  ): boolean {
    if (!context.metadata) {
      return option.criteria.requiredFields.length === 0;
    }

    return option.criteria.requiredFields.every(
      (field) => field in context.metadata!
    );
  }

  private calculateScore<T>(
    option: DecisionOption<T>,
    _context: AgentContext
  ): number {
    const priorityWeight = 0.6;
    const confidenceWeight = 0.4;

    const normalizedPriority = option.criteria.priority / 10;
    const normalizedConfidence = option.criteria.confidence;

    return (
      normalizedPriority * priorityWeight +
      normalizedConfidence * confidenceWeight
    );
  }

  private generateReasoning<T>(
    option: DecisionOption<T>,
    _context: AgentContext
  ): string {
    const score = this.calculateScore(option, _context);
    return `Selected option '${option.id}' with score ${score.toFixed(2)} (priority: ${option.criteria.priority}, confidence: ${option.criteria.confidence})`;
  }
}
