import { normalize } from './text';
import type { Corpus } from './types';

// Entity linking: find the skills, projects, orgs and degree a question talks about,
// by name or alias, and return their graph node ids. Deterministic and exact, so
// "Has he used Three.js?" always lands on skill:threejs.

export interface Entity {
  node: string;
  label: string;
  names: string[];
  /** names, tokenised once (matching runs per question). */
  tokens: string[][];
}

/** Extra ways visitors refer to things (owner-checked; add here, never guess in code). */
const ALIASES: Record<string, readonly string[]> = {
  'skill:threejs': ['three js', '3d', '3d graphics'],
  'skill:webgl': ['gpu rendering'],
  'skill:canvas': ['svg', '2d drawing'],
  'skill:dxf': ['dwg', 'cad file', 'cad files', 'autocad'],
  'skill:pdfjs': ['pdf viewer', 'pdf rendering'],
  'skill:range-requests': ['range request', 'http range', 'byte range', 'partial content'],
  'skill:sse': ['sse', 'server sent events', 'event stream', 'eventsource', 'streaming'],
  'skill:rest-apis': ['rest', 'rest api', 'api integration', 'api integrations'],
  'skill:scss': ['css', 'sass', 'styling'],
  'skill:html': ['html5'],
  'skill:typescript': ['ts'],
  'skill:javascript': ['js', 'es6', 'vanilla js'],
  'skill:rxjs': ['observables', 'reactive programming'],
  'skill:reactive-forms': ['forms', 'form builder', 'dynamic forms', 'formarray'],
  'skill:primeng': ['data table', 'data tables', 'data grid', 'grid'],
  'skill:r-tree': ['rtree', 'spatial index', 'spatial indexing'],
  'skill:undo-redo': ['undo', 'redo'],
  'skill:cpp': ['cpp'],
  'skill:data-structures': ['algorithms', 'dsa'],
  'skill:postgres': ['postgres', 'sql', 'database', 'databases'],
  'skill:llms': ['llm', 'large language model', 'language models', 'generative ai', 'genai'],
  'skill:rag': ['retrieval augmented generation'],
  'skill:mcp': ['model context protocol'],
  // Not keycloak / msal: those are production work (resume), while this skill is "learning".
  'skill:auth': ['authentication', 'login', 'sso', 'oauth'],
  'skill:rbac': ['permissions', 'role based access', 'access control'],
  'skill:system-design': ['architecture'],
  'skill:technical-direction': ['led', 'lead', 'leader', 'leadership', 'leading', 'mentor'],
  'skill:rnd': ['r&d', 'research'],
  'skill:change-detection': ['diff', 'red green'],
  'skill:bounding-boxes': ['bounding box', 'bbox'],
  'skill:text-highlighting': ['highlight', 'highlighting'],
  'skill:large-data-ui': ['large files', 'large json', 'big files'],
  'skill:render-performance': ['performance', 'optimization', 'optimisation'],
  'skill:progressive-loading': ['lazy loading', 'virtualization', 'virtualized', 'virtual scroll'],
  'skill:web-speech': ['speech', 'speech recognition'],
  'project:custom-cad-editor': ['cad editor', 'cad viewer', 'cad'],
  'project:signalling-plan-editor': ['signalling', 'signaling', 'railway', 'signal plan'],
  'project:knowledge-base-ingestion': ['knowledge base', 'ingestion', 'website ingestion'],
  'project:html-bbox-visualizer': ['bounding box visualizer', 'captured web pages'],
  'project:document-review-viewer': ['document review', 'review viewer'],
  'project:progressive-pdf-viewer': ['progressive pdf', 'large pdf', 'large pdfs', 'big pdf'],
  'project:realtime-integrations': ['real time', 'realtime', 'live progress'],
  'project:enterprise-ui-architecture': ['enterprise', 'ui architecture', 'component library'],
  'project:portfolio-rag-agent': [
    'this site',
    'this website',
    'this portfolio',
    'chatbot',
    'ai agent',
  ],
  'project:jarvis-voice': ['jarvis', 'voice agent', 'voice mode', 'voice'],
  'project:cad-playground': ['playground', 'public demo'],
  'org:vassardigital': ['vassardigital', 'vassar digital', 'current company', 'current employer'],
  'org:vassar-labs': ['vassarlabs'],
  'edu:nit-jamshedpur': ['nit', 'mca', 'college', 'university', 'degree', 'masters'],
};

export function buildEntities(corpus: Corpus): Entity[] {
  const out: Entity[] = [];
  const add = (node: string, label: string, given: (string | undefined)[]) => {
    const all = [...given, ...(ALIASES[node] ?? [])].filter((n): n is string => !!n);
    const names = [...new Set(all.map((n) => n.toLowerCase()))];
    out.push({ node, label, names, tokens: names.map((n) => toks(n)) });
  };
  for (const s of corpus.skills) {
    // "SCSS / CSS" → also "scss" and "css"; "R-tree / spatial indexing" → both halves.
    add(`skill:${s.id}`, s.name, [s.name, s.id, ...s.name.split(' / ')]);
  }
  for (const p of corpus.projects) add(`project:${p.slug}`, p.title, [p.title]);
  for (const o of corpus.organizations) add(`org:${o.id}`, o.name, [o.name, o.id]);
  for (const e of corpus.education) add(`edu:${e.id}`, e.shortName, [e.shortName, e.institute]);
  return out;
}

interface Hit {
  node: string;
  start: number;
  end: number;
}

/** Token windows of a phrase, so matching ignores punctuation ("Three.js" = "three js"). */
export function toks(text: string): string[] {
  return normalize(text).match(/[a-z0-9+#]+/g) ?? [];
}

/**
 * Node ids mentioned in `text`, most specific (longest) match first. Overlapping
 * shorter matches are dropped: "three js" links Three.js only, not JavaScript too.
 */
export function linkEntities(text: string, entities: readonly Entity[]): string[] {
  const words = fixTypos(toks(text), entities);
  const hits: Hit[] = [];
  for (const e of entities) {
    for (const n of e.tokens) {
      if (!n.length) continue;
      for (let i = 0; i + n.length <= words.length; i++) {
        if (n.every((w, j) => words[i + j] === w))
          hits.push({ node: e.node, start: i, end: i + n.length });
      }
    }
  }
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken = new Set<number>();
  const nodes: string[] = [];
  for (const h of hits) {
    let free = true;
    for (let i = h.start; i < h.end; i++) if (taken.has(i)) free = false;
    if (!free) continue;
    for (let i = h.start; i < h.end; i++) taken.add(i);
    if (!nodes.includes(h.node)) nodes.push(h.node);
  }
  return nodes;
}

/** Damerau-Levenshtein distance ≤ 1 (one insert, delete, substitute or swap). */
export function oneTypo(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const rest = (x: string, y: string) => x.slice(i + 1) === y.slice(i + 1);
  if (a.length === b.length) {
    return (
      rest(a, b) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2))
    );
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** Replace a misspelt word with the entity name it is one typo away from ("angualr" → "angular"). */
const vocabCache = new WeakMap<readonly Entity[], { known: Set<string>; long: string[] }>();

function fixTypos(words: string[], entities: readonly Entity[]): string[] {
  let cached = vocabCache.get(entities);
  if (!cached) {
    const known = new Set(entities.flatMap((e) => e.tokens.flat()));
    cached = { known, long: [...known].filter((w) => w.length >= 5 && /^[a-z]+$/.test(w)) };
    vocabCache.set(entities, cached);
  }
  const { known, long } = cached;
  return words.map((w) => {
    if (w.length < 5 || known.has(w)) return w;
    return long.find((k) => oneTypo(w, k)) ?? w;
  });
}

/** Common technologies visitors ask about. Used only to say "not in his profile". */
export const COMMON_TECH = [
  'react',
  'react native',
  'next.js',
  'vue',
  'nuxt',
  'svelte',
  'jquery',
  'ember',
  'kubernetes',
  'k8s',
  'docker',
  'terraform',
  'ansible',
  'jenkins',
  'aws',
  'gcp',
  'google cloud',
  'rust',
  'golang',
  'java',
  'spring boot',
  'kotlin',
  'swift',
  'flutter',
  'dart',
  'ruby',
  'rails',
  'php',
  'laravel',
  '.net',
  'c#',
  'scala',
  'elixir',
  'haskell',
  'node.js',
  'express.js',
  'nestjs',
  'graphql',
  'mongodb',
  'mysql',
  'cassandra',
  'kafka',
  'spark',
  'hadoop',
  'tensorflow',
  'pytorch',
  'keras',
  'scikit-learn',
  'pandas',
  'machine learning',
  'deep learning',
  'computer vision',
  'unreal engine',
  'blender',
  'webrtc',
  'electron',
  'tailwind',
  'bootstrap',
  'redux',
  'ngrx',
  'jest',
  'cypress',
  'selenium',
  'figma',
  'salesforce',
  'sap',
  'blockchain',
  'solidity',
  'android',
  'ios',
];

/** COMMON_TECH, tokenised once. */
export const COMMON_TECH_TOKENS: readonly (readonly string[])[] = COMMON_TECH.map((t) => toks(t));
