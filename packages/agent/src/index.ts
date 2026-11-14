// Public API of the portfolio agent (pure TypeScript: browser, Worker, Node).
export { ask, type Context, type Trace } from './agent';
export { extractive, joinAnd, unknown, UNKNOWN } from './answer';
export { buildChunks } from './chunk';
export { caseStudyFile, corpusFromContent, type ContentFiles } from './content';
export { buildEntities, linkEntities } from './entities';
export { guard, MAX_QUESTION } from './guard';
export { analyze, buildIndex, confident, retrieve, type AgentIndex, type Query } from './retrieve';
export type * from './types';
