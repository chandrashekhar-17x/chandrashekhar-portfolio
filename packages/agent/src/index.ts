// Public API of the portfolio agent (pure TypeScript: browser, Worker, Node).
export { ask, type Context, type Trace } from './agent';
export { askWithLlm, type LlmTrace, type Route } from './agent-llm';
export {
  buildMessages,
  PROMPT_VERSION,
  verify,
  type LlmClient,
  type LlmMessage,
  type Verdict,
} from './llm';
export { extractive, joinAnd, unknown, UNKNOWN } from './answer';
export { buildChunks } from './chunk';
export { caseStudyFile, corpusFromContent, type ContentFiles } from './content';
export { buildEntities, linkEntities } from './entities';
export { guard, MAX_QUESTION } from './guard';
export { analyze, buildIndex, confident, retrieve, type AgentIndex, type Query } from './retrieve';
export type * from './types';
