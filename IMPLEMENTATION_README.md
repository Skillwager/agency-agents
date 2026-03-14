# Behavioral Nudge Engine Agent - Implementation

This directory contains the TypeScript implementation of the autonomous AI agent system for SkillWager, with a focus on the **Behavioral Nudge Engine Agent**.

## 🏗️ Architecture

### Core Infrastructure

- **BaseAgent** (`src/agents/base-agent.ts`): Abstract base class that all agents extend. Provides:
  - Zod schema validation for inputs/outputs
  - AI service integration (OpenAI, Anthropic)
  - Audit logging
  - Security playbook enforcement
  - Retry logic with exponential backoff
  - Metrics tracking

- **Type Definitions** (`src/models/types.ts`): Core TypeScript interfaces and types
  
- **AI Service** (`src/core/ai-service.ts`): Unified interface for AI providers (OpenAI, Anthropic)

- **Audit Logger** (`src/core/audit-logger.ts`): Centralized logging for all agent executions

- **Security Playbook** (`src/core/security-playbook.ts`): Input sanitization, output validation, and security enforcement

- **Decision Engine** (`src/core/decision-engine.ts`): Decision-making framework for complex agent reasoning

## 🧠 Behavioral Nudge Engine Agent

Located at `src/agents/behavioral_nudge_engine-agent.ts`

### Purpose

A behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and success. It transforms passive software dashboards into active, tailored productivity partners.

### Key Features

1. **Cadence Personalization**: Adapts communication frequency to user preferences
2. **Cognitive Load Reduction**: Breaks down massive workflows into micro-sprints
3. **Momentum Building**: Leverages gamification and positive reinforcement
4. **ADHD-Friendly Design**: Special support for users with ADHD tendencies
5. **Multi-Channel Support**: SMS, Email, In-App, Push notifications
6. **Behavioral Learning**: Continuously adapts based on user engagement patterns

### Input Schema

```typescript
{
  userProfile: {
    userId: string;
    preferredChannel: 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH';
    interactionFrequency: 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
    tendencies: string[];
    status: 'ENGAGED' | 'OVERWHELMED' | 'INACTIVE' | 'NEW';
    motivationalTriggers: Array<'GAMIFICATION' | 'DIRECT' | 'SOCIAL_PROOF' | 'ACHIEVEMENT'>;
    focusHours?: { start: number; end: number };
    timezone?: string;
  };
  pendingTasks: Task[];
  recentCompletions?: Task[];
  contextMetadata?: {
    timeOfDay: string;
    dayOfWeek: string;
    lastInteractionDate?: string;
    currentStreak?: number;
  };
}
```

### Output Schema

```typescript
{
  nudgeType: 'MICRO_SPRINT' | 'CELEBRATION' | 'GENTLE_REMINDER' | 'PREFERENCE_CHECK' | 'ENCOURAGEMENT';
  primaryNudge: {
    channel: 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH';
    message: string;
    actionButton?: string;
    actionUrl?: string;
    optOutMessage: string;
    celebrationContext?: string;
  };
  microSprint?: {
    tasks: Task[];
    durationMinutes: number;
    motivationalIntro: string;
    completionReward: string;
  };
  reasoning: string;
  adaptationSuggestions?: string[];
  nextFollowUpHours: number;
}
```

## 🧪 Testing

Comprehensive test suite located at `src/agents/behavioral_nudge_engine-agent.test.ts`

**Test Coverage:**
- Agent configuration and initialization
- Schema validation (input/output)
- System prompt generation
- User message building
- AI response parsing
- Fallback nudge generation
- BaseAgent integration
- Edge cases (ADHD users, empty tasks, various frequencies)

**Run Tests:**

```bash
npm test
```

**Test Results:** 32 tests, all passing ✅

## 🚀 Usage Example

```typescript
import { BehavioralNudgeEngineAgent } from './src/agents/behavioral_nudge_engine-agent';

const agent = new BehavioralNudgeEngineAgent({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
});

const result = await agent.execute({
  userProfile: {
    userId: 'user-123',
    preferredChannel: 'EMAIL',
    interactionFrequency: 'DAILY',
    tendencies: ['ADHD'],
    status: 'OVERWHELMED',
    motivationalTriggers: ['ACHIEVEMENT', 'GAMIFICATION'],
  },
  pendingTasks: [
    { id: '1', title: 'Review PR #42', priority: 8, estimatedMinutes: 20 },
    { id: '2', title: 'Update docs', priority: 5, estimatedMinutes: 15 },
    // ... more tasks
  ],
  contextMetadata: {
    timeOfDay: 'morning',
    dayOfWeek: 'Monday',
    currentStreak: 5,
  },
});

if (result.success) {
  console.log('Nudge:', result.data.primaryNudge.message);
  console.log('Type:', result.data.nudgeType);
  
  if (result.data.microSprint) {
    console.log('Micro-sprint tasks:', result.data.microSprint.tasks.length);
  }
}
```

## 🔒 Security Features

All implemented per Security Playbook requirements:

- ✅ Input validation and sanitization
- ✅ Output validation and sensitive data redaction
- ✅ XSS prevention through HTML tag removal
- ✅ Rate limiting support
- ✅ Audit logging for all executions
- ✅ Retry logic with exponential backoff
- ✅ Timeout enforcement

## 📊 Agent Catalog

The agent is registered in `dashboard/src/lib/agent-catalog.ts` with:

- ID: `behavioral-nudge-engine`
- Category: `product`
- Status: `active`
- Version: `1.0.0`
- Full capability list and metadata

## 🛠️ Development

**Install Dependencies:**

```bash
npm install
```

**Build:**

```bash
npm run build
```

**Run Tests:**

```bash
npm test
```

**Run Tests with Coverage:**

```bash
npm run test:coverage
```

**Lint:**

```bash
npm run lint
```

## 📝 Acceptance Criteria

- ✅ Extends BaseAgent with typed I/O (Zod schemas)
- ✅ Tests pass (32/32 tests passing)
- ✅ Security Playbook enforced (input sanitization, output validation, audit logs)
- ✅ AI service integration (OpenAI & Anthropic support)
- ✅ Comprehensive system prompt from spec
- ✅ Fallback logic for robust operation
- ✅ Registered in agent catalog
- ✅ Full TypeScript compilation with strict mode

## 📚 Related Files

- Spec: `product/product-behavioral-nudge-engine.md`
- Agent Implementation: `src/agents/behavioral_nudge_engine-agent.ts`
- Tests: `src/agents/behavioral_nudge_engine-agent.test.ts`
- Base Infrastructure: `src/agents/base-agent.ts`, `src/models/types.ts`, `src/core/`
- Agent Catalog: `dashboard/src/lib/agent-catalog.ts`

## 🎯 Next Steps

1. **Integration**: Connect to SkillWager production APIs
2. **Deployment**: Set up CI/CD pipeline
3. **Monitoring**: Add observability and alerting
4. **Expansion**: Implement additional agents following the same pattern
5. **User Testing**: A/B test different nudge strategies

## 📄 License

MIT License - SkillWager 2026
