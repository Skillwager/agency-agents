import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { AgentConfig, AIServiceConfig, SecurityPlaybook } from '../models/types';
import { defaultSecurityPlaybook } from '../core/security-playbook';

const UserProfileSchema = z.object({
  userId: z.string(),
  preferredChannel: z.enum(['SMS', 'EMAIL', 'IN_APP', 'PUSH']),
  interactionFrequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY']),
  tendencies: z.array(z.string()),
  status: z.enum(['ENGAGED', 'OVERWHELMED', 'INACTIVE', 'NEW']),
  motivationalTriggers: z.array(z.enum(['GAMIFICATION', 'DIRECT', 'SOCIAL_PROOF', 'ACHIEVEMENT'])),
  focusHours: z.object({
    start: z.number().min(0).max(23),
    end: z.number().min(0).max(23),
  }).optional(),
  timezone: z.string().optional(),
});

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().min(1).max(10),
  estimatedMinutes: z.number().optional(),
  dueDate: z.string().optional(),
  category: z.string().optional(),
});

const BehavioralNudgeInputSchema = z.object({
  userProfile: UserProfileSchema,
  pendingTasks: z.array(TaskSchema),
  recentCompletions: z.array(TaskSchema).optional(),
  contextMetadata: z.object({
    timeOfDay: z.string(),
    dayOfWeek: z.string(),
    lastInteractionDate: z.string().optional(),
    currentStreak: z.number().optional(),
  }).optional(),
});

const NudgeMessageSchema = z.object({
  channel: z.enum(['SMS', 'EMAIL', 'IN_APP', 'PUSH']),
  message: z.string(),
  actionButton: z.string().optional(),
  actionUrl: z.string().optional(),
  optOutMessage: z.string(),
  celebrationContext: z.string().optional(),
});

const MicroSprintSchema = z.object({
  tasks: z.array(TaskSchema).max(5),
  durationMinutes: z.number().min(5).max(30),
  motivationalIntro: z.string(),
  completionReward: z.string(),
});

const BehavioralNudgeOutputSchema = z.object({
  nudgeType: z.enum(['MICRO_SPRINT', 'CELEBRATION', 'GENTLE_REMINDER', 'PREFERENCE_CHECK', 'ENCOURAGEMENT']),
  primaryNudge: NudgeMessageSchema,
  microSprint: MicroSprintSchema.optional(),
  reasoning: z.string(),
  adaptationSuggestions: z.array(z.string()).optional(),
  nextFollowUpHours: z.number().min(1).max(168),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type BehavioralNudgeInput = z.infer<typeof BehavioralNudgeInputSchema>;
export type NudgeMessage = z.infer<typeof NudgeMessageSchema>;
export type MicroSprint = z.infer<typeof MicroSprintSchema>;
export type BehavioralNudgeOutput = z.infer<typeof BehavioralNudgeOutputSchema>;

export class BehavioralNudgeEngineAgent extends BaseAgent<
  BehavioralNudgeInput,
  BehavioralNudgeOutput
> {
  readonly inputSchema = BehavioralNudgeInputSchema;
  readonly outputSchema = BehavioralNudgeOutputSchema;

  constructor(
    aiConfig: AIServiceConfig,
    securityPlaybook: SecurityPlaybook = defaultSecurityPlaybook
  ) {
    const config: AgentConfig = {
      name: 'BehavioralNudgeEngine',
      description: 'Behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and success',
      maxRetries: 2,
      timeout: 15000,
      model: aiConfig.model || 'gpt-4',
    };

    super(config, aiConfig, securityPlaybook);
  }

  getSystemPrompt(): string {
    return `# 🧠 Behavioral Nudge Engine

## 🧠 Your Identity & Memory
- **Role**: You are a proactive coaching intelligence grounded in behavioral psychology and habit formation. You transform passive software dashboards into active, tailored productivity partners.
- **Personality**: You are encouraging, adaptive, and highly attuned to cognitive load. You act like a world-class personal trainer for software usage—knowing exactly when to push and when to celebrate a micro-win.
- **Memory**: You remember user preferences for communication channels (SMS vs Email), interaction cadences (daily vs weekly), and their specific motivational triggers (gamification vs direct instruction).
- **Experience**: You understand that overwhelming users with massive task lists leads to churn. You specialize in default-biases, time-boxing (e.g., the Pomodoro technique), and ADHD-friendly momentum building.

## 🎯 Your Core Mission
- **Cadence Personalization**: Adapt the software's communication frequency to user preferences.
- **Cognitive Load Reduction**: Break down massive workflows into tiny, achievable micro-sprints to prevent user paralysis.
- **Momentum Building**: Leverage gamification and immediate positive reinforcement (e.g., celebrating 5 completed tasks instead of focusing on the 95 remaining).
- **Default requirement**: Never send a generic "You have 14 unread notifications" alert. Always provide a single, actionable, low-friction next step.

## 🚨 Critical Rules You Must Follow
- ❌ **No overwhelming task dumps.** If a user has 50 items pending, do not show them 50. Show them the 1 most critical item.
- ❌ **No tone-deaf interruptions.** Respect the user's focus hours and preferred communication channels.
- ✅ **Always offer an "opt-out" completion.** Provide clear off-ramps (e.g., "Great job! Want to do 5 more minutes, or call it for the day?").
- ✅ **Leverage default biases.** (e.g., "I've drafted a thank-you reply for this 5-star review. Should I send it, or do you want to edit?").

## 💭 Your Communication Style
- **Tone**: Empathetic, energetic, highly concise, and deeply personalized.
- **Key Phrase**: "Nice work! We sent 15 follow-ups, wrote 2 templates, and thanked 5 customers. That's amazing. Want to do another 5 minutes, or call it for now?"
- **Focus**: Eliminating friction. You provide the draft, the idea, and the momentum. The user just has to hit "Approve."

## 🔄 Your Workflow Process
1. **Analyze User State**: Understand the user's current engagement level, recent activity, and psychological profile.
2. **Cognitive Load Assessment**: Determine if the user is overwhelmed, engaged, or needs activation.
3. **Craft Personalized Nudge**: Create a message that respects their preferences and maximizes action probability.
4. **Micro-Sprint Design**: For overwhelmed users, break down tasks into 5-30 minute sprints with 1-5 tasks max.
5. **Celebration & Off-Ramp**: Always provide positive reinforcement and a gentle option to pause.

## 📊 Output Format
You must respond with a JSON object containing:
- nudgeType: The type of behavioral intervention
- primaryNudge: The main message to send to the user
- microSprint: (optional) A time-boxed set of 1-5 tasks for overwhelmed users
- reasoning: Why you chose this approach based on behavioral psychology
- adaptationSuggestions: Learnings for future interactions
- nextFollowUpHours: When to check in next (respecting user preferences)

## 🎯 Success Metrics Focus
- Prioritize single-action simplicity over comprehensive information
- Match the user's energy level and communication style
- Build momentum through micro-wins, not massive lists
- Always provide an exit strategy to prevent notification fatigue`;
  }

  buildUserMessage(input: BehavioralNudgeInput): string {
    const { userProfile, pendingTasks, recentCompletions, contextMetadata } = input;

    let message = `# User Context Analysis Request

## User Profile
- User ID: ${userProfile.userId}
- Preferred Channel: ${userProfile.preferredChannel}
- Interaction Frequency: ${userProfile.interactionFrequency}
- Current Status: ${userProfile.status}
- Tendencies: ${userProfile.tendencies.join(', ') || 'None specified'}
- Motivational Triggers: ${userProfile.motivationalTriggers.join(', ')}`;

    if (userProfile.focusHours) {
      message += `\n- Focus Hours: ${userProfile.focusHours.start}:00 - ${userProfile.focusHours.end}:00`;
    }

    if (userProfile.timezone) {
      message += `\n- Timezone: ${userProfile.timezone}`;
    }

    message += `\n\n## Pending Tasks (${pendingTasks.length} total)`;
    
    if (pendingTasks.length > 0) {
      const topTasks = pendingTasks.slice(0, 10);
      topTasks.forEach((task, idx) => {
        message += `\n${idx + 1}. [Priority ${task.priority}] ${task.title}`;
        if (task.estimatedMinutes) {
          message += ` (~${task.estimatedMinutes}min)`;
        }
      });

      if (pendingTasks.length > 10) {
        message += `\n... and ${pendingTasks.length - 10} more tasks`;
      }
    } else {
      message += `\nNo pending tasks`;
    }

    if (recentCompletions && recentCompletions.length > 0) {
      message += `\n\n## Recent Completions (${recentCompletions.length} tasks)`;
      const recent = recentCompletions.slice(0, 5);
      recent.forEach((task, idx) => {
        message += `\n${idx + 1}. ✓ ${task.title}`;
      });
    }

    if (contextMetadata) {
      message += `\n\n## Context Metadata`;
      message += `\n- Time of Day: ${contextMetadata.timeOfDay}`;
      message += `\n- Day of Week: ${contextMetadata.dayOfWeek}`;
      if (contextMetadata.lastInteractionDate) {
        message += `\n- Last Interaction: ${contextMetadata.lastInteractionDate}`;
      }
      if (contextMetadata.currentStreak !== undefined) {
        message += `\n- Current Streak: ${contextMetadata.currentStreak} days`;
      }
    }

    message += `\n\n## Your Task
Based on the user's psychological profile, current status, and task load, generate an appropriate behavioral nudge that will maximize engagement and task completion while preventing overwhelm. Remember to:

1. Respect their communication preferences and interaction frequency
2. Match their motivational triggers (gamification, achievement, etc.)
3. If they are overwhelmed or have ADHD tendencies, create a micro-sprint
4. Always provide celebration for recent wins and a gentle opt-out
5. Focus on the single most impactful action, not a comprehensive list

Respond with a JSON object matching the BehavioralNudgeOutput schema.`;

    return message;
  }

  parseAIResponse(response: string, input: BehavioralNudgeInput): BehavioralNudgeOutput {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.primaryNudge && parsed.message) {
        parsed.primaryNudge = {
          channel: input.userProfile.preferredChannel,
          message: parsed.message,
          optOutMessage: parsed.optOutMessage || "You're doing great! Take a break whenever you need.",
        };
      }

      if (!parsed.nudgeType) {
        parsed.nudgeType = this.inferNudgeType(parsed, input);
      }

      if (!parsed.nextFollowUpHours) {
        parsed.nextFollowUpHours = this.calculateFollowUpTime(input.userProfile);
      }

      return parsed as BehavioralNudgeOutput;
    } catch (error) {
      return this.createFallbackNudge(input);
    }
  }

  private inferNudgeType(
    _parsed: unknown,
    input: BehavioralNudgeInput
  ): BehavioralNudgeOutput['nudgeType'] {
    if (input.recentCompletions && input.recentCompletions.length > 0) {
      return 'CELEBRATION';
    }

    if (input.userProfile.status === 'OVERWHELMED' || 
        input.userProfile.tendencies.includes('ADHD')) {
      return 'MICRO_SPRINT';
    }

    if (input.pendingTasks.length === 0) {
      return 'ENCOURAGEMENT';
    }

    if (input.userProfile.status === 'INACTIVE') {
      return 'GENTLE_REMINDER';
    }

    return 'ENCOURAGEMENT';
  }

  private calculateFollowUpTime(profile: UserProfile): number {
    switch (profile.interactionFrequency) {
      case 'DAILY':
        return 24;
      case 'WEEKLY':
        return 168;
      case 'BI_WEEKLY':
        return 336;
      case 'MONTHLY':
        return 720;
      default:
        return 24;
    }
  }

  private createFallbackNudge(input: BehavioralNudgeInput): BehavioralNudgeOutput {
    const { userProfile, pendingTasks, recentCompletions } = input;

    let message = '';
    let nudgeType: BehavioralNudgeOutput['nudgeType'] = 'ENCOURAGEMENT';
    let microSprint: MicroSprint | undefined;

    if (recentCompletions && recentCompletions.length > 0) {
      nudgeType = 'CELEBRATION';
      message = `Amazing work! You completed ${recentCompletions.length} tasks. `;
      
      if (pendingTasks.length > 0) {
        message += `Want to tackle one more quick win, or call it for now?`;
      } else {
        message += `You're all caught up! Time to celebrate. 🎉`;
      }
    } else if (userProfile.status === 'OVERWHELMED' && pendingTasks.length > 5) {
      nudgeType = 'MICRO_SPRINT';
      const topTasks = pendingTasks
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

      microSprint = {
        tasks: topTasks,
        durationMinutes: 15,
        motivationalIntro: "Let's do a quick 15-minute power session. Just 3 tasks. You've got this!",
        completionReward: "After these 3, take a break. You earned it! ⭐",
      };

      message = `Hey! I know things feel like a lot right now. Let's start with just 15 minutes and knock out 3 quick tasks. Ready to start?`;
    } else if (pendingTasks.length > 0) {
      nudgeType = 'GENTLE_REMINDER';
      const topTask = pendingTasks.sort((a, b) => b.priority - a.priority)[0];
      message = `Quick heads up: "${topTask.title}" is waiting for you. Want to tackle it now, or should I check back later?`;
    } else {
      message = `You're doing great! All caught up for now. I'll check in when something new comes up.`;
    }

    return {
      nudgeType,
      primaryNudge: {
        channel: userProfile.preferredChannel,
        message,
        actionButton: pendingTasks.length > 0 ? 'Get Started' : undefined,
        optOutMessage: "No pressure! Let me know if you'd prefer I check in less often.",
      },
      microSprint,
      reasoning: 'Fallback nudge generated due to AI response parsing issue. Using behavioral heuristics based on user status and task load.',
      adaptationSuggestions: [
        'Monitor user response to this fallback nudge',
        'Consider adjusting communication frequency if user consistently ignores nudges',
      ],
      nextFollowUpHours: this.calculateFollowUpTime(userProfile),
    };
  }
}
