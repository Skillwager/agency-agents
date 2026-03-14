import { AIServiceConfig } from '../models/types';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIServiceResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async generateCompletion(
    messages: AIMessage[],
    options?: Partial<AIServiceConfig>
  ): Promise<AIServiceResponse> {
    const mergedConfig = { ...this.config, ...options };

    if (mergedConfig.provider === 'openai') {
      return this.callOpenAI(messages, mergedConfig);
    } else if (mergedConfig.provider === 'anthropic') {
      return this.callAnthropic(messages, mergedConfig);
    }

    throw new Error(`Unsupported AI provider: ${mergedConfig.provider}`);
  }

  private async callOpenAI(
    messages: AIMessage[],
    config: AIServiceConfig
  ): Promise<AIServiceResponse> {
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: config.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2000,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async callAnthropic(
    messages: AIMessage[],
    config: AIServiceConfig
  ): Promise<AIServiceResponse> {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      });

      const systemMessage = messages.find((m) => m.role === 'system');
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      const response = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 2000,
        temperature: config.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Anthropic response');
      }

      return {
        content: textBlock.text,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
