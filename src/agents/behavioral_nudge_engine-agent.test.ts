import { BehavioralNudgeEngineAgent, BehavioralNudgeInput, UserProfile, Task } from './behavioral_nudge_engine-agent';
import { AIServiceConfig } from '../models/types';

const mockAIConfig: AIServiceConfig = {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  apiKey: 'test-key',
};

const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  userId: 'user-123',
  preferredChannel: 'EMAIL',
  interactionFrequency: 'DAILY',
  tendencies: [],
  status: 'ENGAGED',
  motivationalTriggers: ['ACHIEVEMENT'],
  focusHours: {
    start: 9,
    end: 17,
  },
  timezone: 'America/New_York',
  ...overrides,
});

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: `task-${Math.random()}`,
  title: 'Sample Task',
  priority: 5,
  estimatedMinutes: 15,
  ...overrides,
});

describe('BehavioralNudgeEngineAgent', () => {
  let agent: BehavioralNudgeEngineAgent;

  beforeEach(() => {
    agent = new BehavioralNudgeEngineAgent(mockAIConfig);
  });

  describe('Agent Configuration', () => {
    it('should initialize with correct config', () => {
      expect(agent.getConfig().name).toBe('BehavioralNudgeEngine');
      expect(agent.getConfig().description).toContain('Behavioral psychology specialist');
    });

    it('should have correct status on initialization', () => {
      expect(agent.getStatus()).toBe('idle');
    });

    it('should initialize metrics', () => {
      const metrics = agent.getMetrics();
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.successfulExecutions).toBe(0);
      expect(metrics.failedExecutions).toBe(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct input', () => {
      const validInput: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [createMockTask()],
        recentCompletions: [],
        contextMetadata: {
          timeOfDay: 'morning',
          dayOfWeek: 'Monday',
          currentStreak: 5,
        },
      };

      expect(() => agent.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid user profile', () => {
      const invalidInput = {
        userProfile: {
          userId: 'user-123',
          preferredChannel: 'INVALID_CHANNEL',
          interactionFrequency: 'DAILY',
          tendencies: [],
          status: 'ENGAGED',
          motivationalTriggers: ['ACHIEVEMENT'],
        },
        pendingTasks: [],
      };

      expect(() => agent.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid task priority', () => {
      const invalidInput: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [
          {
            id: 'task-1',
            title: 'Test Task',
            priority: 15,
          },
        ],
      };

      expect(() => agent.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should allow optional fields to be omitted', () => {
      const minimalInput: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [],
      };

      expect(() => agent.inputSchema.parse(minimalInput)).not.toThrow();
    });
  });

  describe('System Prompt', () => {
    it('should generate comprehensive system prompt', () => {
      const systemPrompt = agent.getSystemPrompt();

      expect(systemPrompt).toContain('Behavioral Nudge Engine');
      expect(systemPrompt).toContain('behavioral psychology');
      expect(systemPrompt).toContain('cognitive load');
      expect(systemPrompt).toContain('micro-sprint');
      expect(systemPrompt).toContain('gamification');
    });

    it('should include critical rules in system prompt', () => {
      const systemPrompt = agent.getSystemPrompt();

      expect(systemPrompt).toContain('No overwhelming task dumps');
      expect(systemPrompt).toContain('opt-out');
      expect(systemPrompt).toContain('default biases');
    });

    it('should specify output format requirements', () => {
      const systemPrompt = agent.getSystemPrompt();

      expect(systemPrompt).toContain('JSON object');
      expect(systemPrompt).toContain('nudgeType');
      expect(systemPrompt).toContain('primaryNudge');
      expect(systemPrompt).toContain('reasoning');
    });
  });

  describe('User Message Building', () => {
    it('should build comprehensive user message', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [
          createMockTask({ title: 'Task 1', priority: 8 }),
          createMockTask({ title: 'Task 2', priority: 5 }),
        ],
        recentCompletions: [
          createMockTask({ title: 'Completed Task' }),
        ],
        contextMetadata: {
          timeOfDay: 'morning',
          dayOfWeek: 'Monday',
          currentStreak: 3,
        },
      };

      const message = agent.buildUserMessage(input);

      expect(message).toContain('User ID: user-123');
      expect(message).toContain('Preferred Channel: EMAIL');
      expect(message).toContain('Task 1');
      expect(message).toContain('Task 2');
      expect(message).toContain('Completed Task');
      expect(message).toContain('Current Streak: 3');
    });

    it('should handle empty task lists', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [],
      };

      const message = agent.buildUserMessage(input);

      expect(message).toContain('No pending tasks');
    });

    it('should truncate large task lists', () => {
      const tasks = Array.from({ length: 20 }, (_, i) =>
        createMockTask({ title: `Task ${i + 1}` })
      );

      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: tasks,
      };

      const message = agent.buildUserMessage(input);

      expect(message).toContain('and 10 more tasks');
    });

    it('should include focus hours when available', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          focusHours: { start: 9, end: 17 },
        }),
        pendingTasks: [],
      };

      const message = agent.buildUserMessage(input);

      expect(message).toContain('Focus Hours: 9:00 - 17:00');
    });
  });

  describe('AI Response Parsing', () => {
    it('should parse valid JSON response', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [createMockTask()],
      };

      const aiResponse = JSON.stringify({
        nudgeType: 'GENTLE_REMINDER',
        primaryNudge: {
          channel: 'EMAIL',
          message: 'Quick reminder about your pending task!',
          optOutMessage: 'No worries if you want to skip this.',
        },
        reasoning: 'User is engaged and has minimal tasks',
        nextFollowUpHours: 24,
      });

      const result = agent.parseAIResponse(aiResponse, input);

      expect(result.nudgeType).toBe('GENTLE_REMINDER');
      expect(result.primaryNudge.message).toContain('pending task');
      expect(result.nextFollowUpHours).toBe(24);
    });

    it('should handle response with surrounding text', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [],
      };

      const aiResponse = `Here's the analysis: ${JSON.stringify({
        nudgeType: 'ENCOURAGEMENT',
        primaryNudge: {
          channel: 'EMAIL',
          message: 'Great job staying on top of everything!',
          optOutMessage: 'Let me know if you need anything.',
        },
        reasoning: 'User has no pending tasks',
        nextFollowUpHours: 24,
      })} That's my recommendation.`;

      const result = agent.parseAIResponse(aiResponse, input);

      expect(result.nudgeType).toBe('ENCOURAGEMENT');
    });

    it('should create fallback nudge for unparseable response', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [
          createMockTask({ title: 'Important Task', priority: 9 }),
        ],
      };

      const aiResponse = 'This is not valid JSON';

      const result = agent.parseAIResponse(aiResponse, input);

      expect(result.nudgeType).toBeDefined();
      expect(result.primaryNudge).toBeDefined();
      expect(result.primaryNudge.message).toBeTruthy();
      expect(result.reasoning).toContain('Fallback');
    });

    it('should infer nudge type when missing', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({ status: 'OVERWHELMED' }),
        pendingTasks: Array.from({ length: 10 }, () => createMockTask()),
      };

      const aiResponse = JSON.stringify({
        primaryNudge: {
          channel: 'EMAIL',
          message: 'Lets break this down',
          optOutMessage: 'Take a break if needed',
        },
        reasoning: 'User needs help',
        nextFollowUpHours: 12,
      });

      const result = agent.parseAIResponse(aiResponse, input);

      expect(result.nudgeType).toBe('MICRO_SPRINT');
    });
  });

  describe('Fallback Nudge Generation', () => {
    it('should create celebration nudge for recent completions', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [],
        recentCompletions: [
          createMockTask({ title: 'Done 1' }),
          createMockTask({ title: 'Done 2' }),
        ],
      };

      const result = agent.parseAIResponse('invalid', input);

      expect(result.nudgeType).toBe('CELEBRATION');
      expect(result.primaryNudge.message).toContain('Amazing work');
      expect(result.primaryNudge.message).toContain('2 tasks');
    });

    it('should create micro-sprint for overwhelmed users', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        createMockTask({ title: `Task ${i}`, priority: i })
      );

      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          status: 'OVERWHELMED',
          tendencies: ['ADHD'],
        }),
        pendingTasks: tasks,
      };

      const result = agent.parseAIResponse('invalid', input);

      expect(result.nudgeType).toBe('MICRO_SPRINT');
      expect(result.microSprint).toBeDefined();
      expect(result.microSprint!.tasks.length).toBeLessThanOrEqual(3);
      expect(result.microSprint!.durationMinutes).toBeGreaterThanOrEqual(5);
    });

    it('should create gentle reminder for inactive users', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          status: 'INACTIVE',
        }),
        pendingTasks: [createMockTask({ title: 'Waiting Task' })],
      };

      const result = agent.parseAIResponse('invalid', input);

      expect(result.nudgeType).toBe('GENTLE_REMINDER');
      expect(result.primaryNudge.message).toContain('Waiting Task');
    });

    it('should respect user preferred channel in fallback', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          preferredChannel: 'SMS',
        }),
        pendingTasks: [],
      };

      const result = agent.parseAIResponse('invalid', input);

      expect(result.primaryNudge.channel).toBe('SMS');
    });

    it('should calculate next follow-up based on frequency', () => {
      const weeklyInput: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          interactionFrequency: 'WEEKLY',
        }),
        pendingTasks: [],
      };

      const result = agent.parseAIResponse('invalid', weeklyInput);

      expect(result.nextFollowUpHours).toBe(168);
    });
  });

  describe('Integration with BaseAgent', () => {
    it('should have valid input schema', () => {
      expect(agent.inputSchema).toBeDefined();
      expect(typeof agent.inputSchema.parse).toBe('function');
    });

    it('should have valid output schema', () => {
      expect(agent.outputSchema).toBeDefined();
      expect(typeof agent.outputSchema.parse).toBe('function');
    });

    it('should validate output against schema', () => {
      const validOutput = {
        nudgeType: 'ENCOURAGEMENT' as const,
        primaryNudge: {
          channel: 'EMAIL' as const,
          message: 'Keep up the great work!',
          optOutMessage: 'Let me know if you need a break.',
        },
        reasoning: 'User is performing well',
        nextFollowUpHours: 24,
      };

      expect(() => agent.outputSchema.parse(validOutput)).not.toThrow();
    });

    it('should reject invalid output', () => {
      const invalidOutput = {
        nudgeType: 'INVALID_TYPE',
        primaryNudge: {
          channel: 'EMAIL',
          message: 'Test',
        },
      };

      expect(() => agent.outputSchema.parse(invalidOutput)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with ADHD tendencies', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          tendencies: ['ADHD', 'perfectionism'],
          status: 'OVERWHELMED',
        }),
        pendingTasks: Array.from({ length: 15 }, () => createMockTask()),
      };

      const message = agent.buildUserMessage(input);

      expect(message).toContain('ADHD');
      expect(message).toContain('perfectionism');
    });

    it('should handle user with no motivational triggers', () => {
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile({
          motivationalTriggers: [],
        }),
        pendingTasks: [],
      };

      const message = agent.buildUserMessage(input);

      expect(message).toBeDefined();
    });

    it('should handle very long task descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      const input: BehavioralNudgeInput = {
        userProfile: createMockUserProfile(),
        pendingTasks: [
          createMockTask({
            description: longDescription,
          }),
        ],
      };

      const message = agent.buildUserMessage(input);

      expect(message).toBeDefined();
    });

    it('should handle all interaction frequencies', () => {
      const frequencies: Array<UserProfile['interactionFrequency']> = [
        'DAILY',
        'WEEKLY',
        'BI_WEEKLY',
        'MONTHLY',
      ];

      frequencies.forEach((frequency) => {
        const input: BehavioralNudgeInput = {
          userProfile: createMockUserProfile({
            interactionFrequency: frequency,
          }),
          pendingTasks: [],
        };

        expect(() => agent.inputSchema.parse(input)).not.toThrow();
      });
    });

    it('should handle all communication channels', () => {
      const channels: Array<UserProfile['preferredChannel']> = [
        'SMS',
        'EMAIL',
        'IN_APP',
        'PUSH',
      ];

      channels.forEach((channel) => {
        const input: BehavioralNudgeInput = {
          userProfile: createMockUserProfile({
            preferredChannel: channel,
          }),
          pendingTasks: [],
        };

        const result = agent.parseAIResponse('invalid', input);

        expect(result.primaryNudge.channel).toBe(channel);
      });
    });
  });
});
