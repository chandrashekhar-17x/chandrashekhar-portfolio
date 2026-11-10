// DEMO DATA for the AI Lab HUD. The agents and models don't exist yet:
// Phase 4–6 replace this with live status from the backend (GET /lab/status).
// The UI labels it "demo" so visitors aren't misled.

export type AgentState = 'active' | 'standby';

export interface AgentStatus {
  icon: string;
  name: string;
  state: AgentState;
  /** Show the little equaliser (agent is "speaking"). */
  busy?: boolean;
}

export interface ModelRoute {
  name: string;
  role: string;
  primary: boolean;
}

export interface LabStatus {
  agents: AgentStatus[];
  models: ModelRoute[];
  chunksIndexed: number;
  metrics: { label: string; value: string }[];
}

export const DEMO_LAB_STATUS: LabStatus = {
  agents: [
    { icon: '🧭', name: 'Portfolio guide', state: 'active', busy: true },
    { icon: '🎯', name: 'Recruiter match', state: 'active' },
    { icon: '🧩', name: 'Project explainer', state: 'standby' },
    { icon: '🎙️', name: 'Voice (Jarvis)', state: 'standby' },
  ],
  models: [
    { name: 'Claude', role: 'primary', primary: true },
    { name: 'Groq / Llama', role: 'fast fallback', primary: true },
    { name: 'OpenAI', role: 'embeddings', primary: false },
    { name: 'Ollama', role: 'local dev', primary: false },
  ],
  chunksIndexed: 312,
  metrics: [
    { label: 'p95 latency', value: '1.8s first token' },
    { label: 'Grounded', value: '98% cited' },
  ],
};
