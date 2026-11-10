import { experienceYears } from '../../core/time/duration';
import type { ScriptedAnswer } from './scripted-answers';

// DEMO answers for the scripted chat (until the RAG agent lands in Phase 4).
// Rules (docs/agents.md, content/evals/agent-evals.json):
// - only say what the portfolio content supports; never invent numbers, employers or skills;
// - public project titles only: never expand internal names or name clients;
// - citations are knowledge-graph node ids (checked by a test).
// Order matters on ties: earlier answers win, so the narrow ones come first.

const YEARS = experienceYears([{ start: '2023-01' }]).replace(/\s*yrs?$/, ''); // "3+"

export const SCRIPTED_ANSWERS: readonly ScriptedAnswer[] = [
  {
    keywords: ['client', 'customer'],
    intent: 'about',
    text: "I don't share client or customer names. In general terms: he builds CAD and railway signalling-plan tooling, document-processing and PDF viewers, and data-extraction interfaces for enterprise products.",
    citations: ['project:signalling-plan-editor', 'project:document-review-viewer'],
  },
  {
    keywords: ['codename', 'internal', 'acronym', 'abbreviation', 'stand'],
    intent: 'about',
    text: "I can't expand internal product names. Publicly, that work is railway signalling-plan digitisation and editing, built on his custom CAD editor.",
    citations: ['project:signalling-plan-editor', 'project:custom-cad-editor'],
    urls: ['/work/signalling-plan-editor'],
  },
  {
    keywords: ['r-tree', 'rtree', 'spatial', 'index', 'hit-test'],
    intent: 'project',
    text: 'The CAD editor keeps every entity in an R-tree, a spatial index. Hit-testing, selection and search then check only the entities near the cursor or the search box instead of all of them, so it stays fast on large drawings.',
    citations: ['skill:r-tree', 'project:custom-cad-editor', 'skill:render-performance'],
    urls: ['/work/custom-cad-editor'],
  },
  {
    keywords: ['why', 'custom', 'library', 'instead', 'approach'],
    intent: 'project',
    text: 'He evaluated 3 approaches. Approach 1 (backend + frontend rendering) and approach 2 (an existing DXF viewer library) both fell short on accurate text, patterns and tables, on editing, and on the JSON domain data. A custom Three.js + Canvas + R-tree editor gave full control, so that is what shipped.',
    citations: ['project:custom-cad-editor', 'skill:rnd', 'skill:threejs', 'skill:r-tree'],
    urls: ['/work/custom-cad-editor'],
  },
  {
    keywords: ['biggest', 'flagship', 'proud', 'largest', 'best'],
    intent: 'project',
    text: 'The custom CAD viewer/editor: he took it from R&D to production in Three.js + Canvas + an R-tree, with 8 DXF entity types + CAD tables, a full editing suite with undo/redo, and DXF/PDF export. It became the foundation of a core product workflow.',
    citations: [
      'project:custom-cad-editor',
      'skill:threejs',
      'skill:dxf-entities',
      'skill:undo-redo',
    ],
    urls: ['/work/custom-cad-editor'],
  },
  {
    keywords: ['led', 'lead', 'leadership', 'direction', 'own'],
    intent: 'about',
    text: 'Yes: he led the UI / CAD-viewer implementation and its technical direction for about 2 months of the workflow’s initial development, then owned the editor.',
    citations: ['skill:technical-direction', 'project:custom-cad-editor', 'hub:leadership'],
  },
  {
    keywords: ['where', 'work', 'company', 'employer', 'current'],
    intent: 'about',
    text: 'He is a Software Engineer at VassarDigital.ai since Jan 2024, in Hyderabad. Before that he was at Vassar Labs: full-time Aug–Dec 2023, and an intern Jan–Jul 2023.',
    citations: ['org:vassardigital', 'org:vassar-labs'],
  },
  {
    keywords: ['years', 'experience', 'long', 'senior'],
    intent: 'about',
    text: `${YEARS} years, counting from Jan 2023 (including his internship).`,
    citations: ['org:vassardigital', 'org:vassar-labs'],
  },
  {
    keywords: ['study', 'studied', 'education', 'degree', 'college', 'university', 'mca'],
    intent: 'about',
    text: 'MCA (Master of Computer Applications), Computer Software Engineering, at NIT Jamshedpur, 2020–2023.',
    citations: ['edu:nit-jamshedpur'],
  },
  {
    keywords: ['three', 'webgl', '3d', 'cad', 'dxf'],
    intent: 'project',
    text: 'Yes: Three.js and WebGL power the CAD/DXF viewer and editor he built: rendering, editing, measurement and entity interaction.',
    citations: ['skill:threejs', 'skill:webgl', 'project:custom-cad-editor', 'skill:dxf'],
    urls: ['/work/custom-cad-editor'],
  },
  {
    keywords: ['pdf', 'large', 'range', 'document', 'highlight'],
    intent: 'project',
    text: 'Progressive loading: PDF.js with HTTP Range Requests streams only the pages being viewed, so large PDFs open fast. He also built PDF review with precise text and image highlighting.',
    citations: [
      'project:progressive-pdf-viewer',
      'skill:pdfjs',
      'skill:range-requests',
      'project:document-review-viewer',
    ],
    urls: ['/work/progressive-pdf-viewer'],
  },
  {
    keywords: ['sse', 'server-sent', 'real-time', 'realtime', 'stream', 'live'],
    intent: 'skills',
    text: 'Yes: Server-Sent Events power live progress in his real-time integrations at work, and this site’s chat will stream answers over SSE too.',
    citations: ['skill:sse', 'project:realtime-integrations', 'project:portfolio-rag-agent'],
    urls: ['/work/realtime-integrations'],
  },
  {
    keywords: ['django', 'fastapi', 'backend', 'python', 'database'],
    intent: 'skills',
    text: 'He is learning backend now (growing): Python, Django/FastAPI, databases and auth. This site’s API is being built with FastAPI. He doesn’t claim professional backend experience yet.',
    citations: ['hub:backend', 'skill:python', 'skill:fastapi', 'skill:django'],
  },
  {
    keywords: ['who', 'about', 'chandrashekhar', 'introduce', 'yourself'],
    intent: 'about',
    text: `Chandrashekhar is a Software Engineer (${YEARS} years, Angular) at VassarDigital.ai who built a custom Three.js CAD editor from scratch. He also builds PDF/document tooling and real-time UIs, and is now growing into backend and AI engineering.`,
    citations: ['hub:frontend', 'project:custom-cad-editor', 'hub:documents', 'hub:ai'],
  },
  {
    // No generic words like "know"/"tech": "Does he know Rust?" must hit the fallback.
    keywords: ['skill', 'strong', 'stack'],
    intent: 'skills',
    text: 'Strongest: Angular, TypeScript, JavaScript and RxJS; Three.js/WebGL and Canvas for CAD; PDF.js with Range Requests; REST and SSE. Growing: Python, Django/FastAPI, databases, LLMs, RAG and MCP.',
    citations: [
      'skill:angular',
      'skill:typescript',
      'skill:rxjs',
      'skill:threejs',
      'skill:pdfjs',
      'skill:sse',
      'hub:ai',
    ],
  },
  {
    keywords: ['table', 'grid', 'primeng', 'forms', 'architecture'],
    intent: 'project',
    text: 'Enterprise Angular UI architecture: reusable components, modular features, reactive forms and PrimeNG data tables that stay fast on large JSON.',
    citations: ['project:enterprise-ui-architecture', 'skill:primeng', 'skill:reactive-forms'],
    urls: ['/work/enterprise-ui-architecture'],
  },
  {
    keywords: ['ai', 'llm', 'rag', 'langchain', 'agent', 'learning'],
    intent: 'skills',
    text: "He is learning AI engineering in public: LLM APIs, RAG, LangChain/LangGraph and MCP, by building this portfolio's agent. Notice the graph: the nodes this answer cites are lit up.",
    citations: [
      'hub:ai',
      'skill:rag',
      'skill:llms',
      'skill:langchain',
      'skill:mcp',
      'project:portfolio-rag-agent',
    ],
    urls: ['/work/portfolio-rag-agent'],
  },
  {
    keywords: ['hire', 'available', 'contact', 'email', 'job'],
    intent: 'contact',
    text: 'The quickest route is the contact form at the bottom of the page, or LinkedIn.',
    citations: ['hub:frontend', 'hub:ai'],
    urls: ['/#contact'],
  },
  {
    keywords: ['jd', 'match', 'fit', 'description', 'requirements'],
    intent: 'jd_match',
    text: 'Demo fit report for an "Angular + AI frontend" role:\n✓ Angular, TypeScript, RxJS: strong, with projects as evidence\n✓ Complex UI: custom CAD editor, PDF viewers\n◐ Python / FastAPI: growing, used in this portfolio\n✗ Anything not in his data, e.g. Kubernetes: no evidence, so it is not claimed.',
    citations: [
      'skill:angular',
      'skill:typescript',
      'project:custom-cad-editor',
      'project:progressive-pdf-viewer',
      'skill:python',
    ],
  },
  {
    keywords: ['how', 'built', 'site', 'portfolio'],
    intent: 'about',
    text: 'This site is an Angular SSR app that loads each section lazily, backed by FastAPI and PostgreSQL with pgvector, with a streaming RAG agent coming in a later phase.',
    citations: ['skill:angular', 'skill:fastapi', 'skill:postgres', 'project:portfolio-rag-agent'],
    urls: ['/work/portfolio-rag-agent'],
  },
];
