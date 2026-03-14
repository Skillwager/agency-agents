export interface AgentCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'engineering' | 'marketing' | 'support' | 'analytics';
  emoji: string;
  color: string;
  capabilities: string[];
  inputSchema: string;
  outputSchema: string;
  status: 'active' | 'beta' | 'experimental' | 'deprecated';
  version: string;
}

export const AGENT_CATALOG: AgentCatalogEntry[] = [
  {
    id: 'behavioral-nudge-engine',
    name: 'Behavioral Nudge Engine',
    description: 'Behavioral psychology specialist that adapts software interaction cadences and styles to maximize user motivation and success.',
    category: 'product',
    emoji: '🧠',
    color: '#FF8A65',
    capabilities: [
      'Cadence Personalization',
      'Cognitive Load Reduction',
      'Momentum Building through Gamification',
      'Micro-Sprint Task Breakdown',
      'ADHD-Friendly Interaction Design',
      'Celebration & Positive Reinforcement',
      'Multi-Channel Communication (SMS, Email, In-App, Push)',
      'Behavioral Pattern Learning',
    ],
    inputSchema: 'BehavioralNudgeInput',
    outputSchema: 'BehavioralNudgeOutput',
    status: 'active',
    version: '1.0.0',
  },
];

export function getAgentById(id: string): AgentCatalogEntry | undefined {
  return AGENT_CATALOG.find((agent) => agent.id === id);
}

export function getAgentsByCategory(
  category: AgentCatalogEntry['category']
): AgentCatalogEntry[] {
  return AGENT_CATALOG.filter((agent) => agent.category === category);
}

export function getActiveAgents(): AgentCatalogEntry[] {
  return AGENT_CATALOG.filter((agent) => agent.status === 'active');
}

export function searchAgents(query: string): AgentCatalogEntry[] {
  const lowerQuery = query.toLowerCase();
  return AGENT_CATALOG.filter(
    (agent) =>
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.description.toLowerCase().includes(lowerQuery) ||
      agent.capabilities.some((cap) => cap.toLowerCase().includes(lowerQuery))
  );
}
