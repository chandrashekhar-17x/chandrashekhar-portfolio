import { ChatIntent } from '../../core/chat/chat-events';

// DEMO answers for the scripted chat (Phase 1). Replaced by the real RAG agent in Phase 4.
// Rule (docs/agents.md): only say what the portfolio content supports; never invent
// numbers, employers or skills. Citations are knowledge-graph node ids, checked by a test.

export interface ScriptedAnswer {
  keywords: string[];
  intent: ChatIntent;
  text: string;
  citations: string[];
  urls?: string[];
}

export const SCRIPTED_ANSWERS: readonly ScriptedAnswer[] = [
  {
    keywords: ['who', 'about', 'chandrashekhar', 'introduce', 'yourself'],
    intent: 'about',
    text: 'Chandrashekhar is a frontend engineer focused on Angular and TypeScript who builds complex UIs: a canvas CAD editor, PDF rendering and data-heavy PrimeNG tables. He is now learning AI engineering (Python, FastAPI, RAG and agents), and this site is one of those projects.',
    citations: [
      'hub:frontend',
      'project:cad-editor',
      'project:pdf-engine',
      'hub:ai',
      'project:ai-portfolio',
    ],
  },
  {
    // No generic words like "know"/"tech": "Does he know Rust?" must hit the fallback.
    keywords: ['skill', 'strong', 'stack'],
    intent: 'skills',
    text: 'Strongest: Angular, TypeScript, JavaScript and RxJS, plus PrimeNG, canvas graphics and PDF.js. Currently learning: Python, FastAPI, PostgreSQL, LLM APIs, RAG, LangChain/LangGraph and MCP.',
    citations: [
      'skill:angular',
      'skill:typescript',
      'skill:rxjs',
      'skill:primeng',
      'skill:canvas',
      'skill:python',
      'skill:rag',
    ],
  },
  {
    keywords: ['cad', 'editor', 'drawing', 'canvas'],
    intent: 'project',
    text: 'He built a browser-based CAD editor in Angular on HTML canvas, using RxJS. The case study covers the problem, his approach and the result.',
    citations: ['project:cad-editor', 'skill:canvas', 'skill:rxjs', 'skill:angular'],
    urls: ['/work/cad-editor'],
  },
  {
    keywords: ['pdf', 'render', 'viewer', 'document'],
    intent: 'project',
    text: 'He worked on in-browser PDF rendering with PDF.js and canvas in Angular. See the PDF Rendering Engine case study for details.',
    citations: ['project:pdf-engine', 'skill:pdfjs', 'skill:canvas'],
    urls: ['/work/pdf-engine'],
  },
  {
    keywords: ['table', 'grid', 'primeng', 'data'],
    intent: 'project',
    text: 'Yes: data-heavy screens with PrimeNG tables, connected to REST APIs with RxJS. The Enterprise Data Grid case study has the details.',
    citations: ['project:data-grid', 'skill:primeng', 'skill:rest-apis'],
    urls: ['/work/data-grid'],
  },
  {
    keywords: ['api', 'integration', 'rest', 'backend', 'python', 'fastapi'],
    intent: 'skills',
    text: 'On the frontend he integrates REST APIs. On the backend he is learning Python and FastAPI; the API behind this site is being built with FastAPI and PostgreSQL.',
    citations: ['skill:rest-apis', 'skill:python', 'skill:fastapi', 'skill:postgres'],
  },
  {
    keywords: ['ai', 'llm', 'rag', 'langchain', 'agent', 'learning', 'machine'],
    intent: 'skills',
    text: "He is learning AI engineering in public: LLM APIs, RAG, LangChain/LangGraph and MCP, by building this portfolio's agent. Notice the graph: the nodes this answer cites are lit up.",
    citations: [
      'hub:ai',
      'skill:rag',
      'skill:llms',
      'skill:langchain',
      'skill:mcp',
      'project:ai-portfolio',
    ],
  },
  {
    keywords: ['hire', 'available', 'contact', 'email', 'job', 'role'],
    intent: 'contact',
    text: 'He is open to frontend and AI-engineering roles. The quickest route is the contact section at the bottom of the page.',
    citations: ['hub:frontend', 'hub:ai'],
    urls: ['/#contact'],
  },
  {
    keywords: ['jd', 'match', 'fit', 'description', 'requirements'],
    intent: 'jd_match',
    text: 'Demo fit report for an "Angular + AI frontend" role:\n✓ Angular, TypeScript, RxJS: strong, with projects as evidence\n✓ Complex UI on canvas: CAD editor, PDF engine\n◐ Python / FastAPI: learning, used in this portfolio\n✗ Anything not in his data, e.g. Kubernetes: no evidence, so it is not claimed.',
    citations: [
      'skill:angular',
      'skill:typescript',
      'project:cad-editor',
      'project:pdf-engine',
      'skill:python',
    ],
  },
  {
    keywords: ['how', 'built', 'site', 'portfolio', 'architecture'],
    intent: 'about',
    text: 'This site is an Angular SSR app that loads each section lazily, backed by FastAPI and PostgreSQL with pgvector, with a streaming RAG agent coming in a later phase.',
    citations: ['skill:angular', 'skill:fastapi', 'skill:postgres', 'project:ai-portfolio'],
    urls: ['/work/ai-portfolio'],
  },
];

export const FALLBACK_ANSWER: ScriptedAnswer = {
  keywords: [],
  intent: 'off-topic',
  text: "I don't have that in his portfolio data, so I won't guess. You can ask him directly through the contact form, or ask about his skills, projects or AI work.",
  citations: [],
};

export const SUGGESTED_QUESTIONS: readonly string[] = [
  'Who is Chandrashekhar?',
  'What are his key skills?',
  'Tell me about the CAD editor',
  'How is AI used here?',
  'Does he fit an Angular + AI role? (JD match)',
  'How is this site built?',
];

/** Best keyword match (most keywords found), else the honest fallback. */
export function pickAnswer(question: string): ScriptedAnswer {
  const q = question.toLowerCase();
  let best = FALLBACK_ANSWER;
  let bestScore = 0;
  for (const a of SCRIPTED_ANSWERS) {
    const score = a.keywords.filter((k) => new RegExp(`\\b${k}`).test(q)).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
