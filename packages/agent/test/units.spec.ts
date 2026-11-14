import { beforeAll, describe, expect, it } from 'vitest';

import { ask, buildIndex, linkEntities, type AgentIndex } from '../src';
import { buildBm25, scoreBm25 } from '../src/bm25';
import { splitWords } from '../src/chunk';
import { oneTypo } from '../src/entities';
import { htmlText } from '../src/resume';
import {
  normalize,
  rangeLabel,
  sentences,
  stem,
  stripMarkdown,
  terms,
  tokenize,
} from '../src/text';
import { loadCorpus, loadEvals } from './corpus';

let index: AgentIndex;
beforeAll(() => {
  index = buildIndex(loadCorpus());
});

describe('text', () => {
  it('keeps tech spellings and their parts', () => {
    expect(tokenize('Three.js and R-tree, C++')).toEqual(
      expect.arrayContaining(['three.js', 'threejs', 'three', 'js', 'r-tree', 'tree', 'c++']),
    );
  });

  it('normalises quotes, dashes and accents', () => {
    expect(normalize('Résumé – it’s')).toBe("resume - it's");
  });

  it('stems plurals and verb forms to the same term', () => {
    expect(stem('editors')).toBe(stem('editor'));
    expect(terms('rendering')).toEqual(terms('rendered'));
  });

  it('formats LinkedIn-style ranges', () => {
    expect(rangeLabel('2023-08', '2023-12')).toBe('Aug–Dec 2023');
    expect(rangeLabel('2024-01')).toBe('Jan 2024 – present');
  });

  it('splits sentences without breaking "Three.js"', () => {
    expect(sentences('He used Three.js daily. It worked.')).toEqual([
      'He used Three.js daily.',
      'It worked.',
    ]);
  });

  it('turns tables into sentences and keeps diagram words', () => {
    const md = '| A | B |\n| --- | --- |\n| Fast selection | R-tree index |\n\n```\nx ──► y\n```';
    const plain = stripMarkdown(md);
    expect(plain).toContain('Fast selection: R-tree index.');
    expect(plain).toMatch(/x\s+y/);
  });

  it('splits long sections at paragraph breaks', () => {
    const long = Array.from({ length: 3 }, (_, i) => `${'word '.repeat(70)}p${String(i)}.`).join(
      '\n\n',
    );
    expect(splitWords(long).length).toBeGreaterThan(1);
  });
});

describe('bm25', () => {
  it('ranks the doc with the rare term first', () => {
    const idx = buildBm25([['angular', 'forms'], ['angular', 'rtree'], ['angular']]);
    const scores = scoreBm25(idx, ['rtree']);
    expect(scores.indexOf(Math.max(...scores))).toBe(1);
  });
});

describe('entities', () => {
  it('links names and aliases, longest match first', () => {
    const nodes = linkEntities('Has he used three js and server sent events?', index.entities);
    expect(nodes).toEqual(expect.arrayContaining(['skill:threejs', 'skill:sse']));
    expect(nodes).not.toContain('skill:javascript');
  });

  it('forgives one typo on longer words', () => {
    expect(oneTypo('angualr', 'angular')).toBe(true);
    expect(oneTypo('python', 'pytorch')).toBe(false);
    expect(linkEntities('Does he know Angualr?', index.entities)).toContain('skill:angular');
  });
});

describe('index', () => {
  it('has unique chunk ids', () => {
    const ids = index.chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only cites nodes that exist in the knowledge graph', () => {
    const c = loadCorpus();
    const valid = new Set([
      ...c.skills.map((s) => `skill:${s.id}`),
      ...c.skills.map((s) => `hub:${s.category}`),
      ...c.projects.map((p) => `project:${p.slug}`),
      ...c.organizations.map((o) => `org:${o.id}`),
      ...c.education.map((e) => `edu:${e.id}`),
    ]);
    const unknown = index.chunks.flatMap((ch) => ch.nodes).filter((n) => !valid.has(n));
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('reads the resume', () => {
    expect(htmlText('<b>A</b> &amp; B <i>(C )</i>')).toBe('A & B (C)');
    expect(index.chunks.some((c) => c.kind === 'resume' && c.text.includes('Keycloak'))).toBe(true);
  });
});

describe('guard and honesty', () => {
  it('never expands an internal name, even when asked by name', () => {
    // A real internal name, rebuilt from character codes so it isn't stored as text.
    const name = String.fromCharCode(69, 83, 80);
    for (const q of [`What does ${name} stand for?`, `What is ${name}?`]) {
      const { answer } = ask(index, q);
      expect(answer.text).not.toContain(name);
      expect(['policy', 'unknown']).toContain(answer.kind);
    }
  });

  it('refuses over-long questions without retrieving', () => {
    const { answer, results } = ask(index, 'a'.repeat(501));
    expect(answer.kind).toBe('policy');
    expect(results).toEqual([]);
  });

  it('answers the same question the same way (deterministic)', () => {
    const a = ask(index, 'What is his biggest project?').answer;
    const b = ask(index, 'What is his biggest project?').answer;
    expect(b).toEqual(a);
  });

  it('cites graph nodes for real answers', () => {
    const { answer } = ask(index, 'Has he built a PDF viewer?');
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.urls).toContain('/work/progressive-pdf-viewer');
  });
});

describe('answers like a careful assistant', () => {
  const all = () => [
    ...loadEvals().map((c) => c.question),
    'What is his favourite movie?',
    'Does he know Kotlin?',
    'Is he married?',
    'What is the weather in Hyderabad?',
  ];

  it('every "cannot answer" says so plainly and points to Chandrashekhar', () => {
    for (const q of all()) {
      const { answer } = ask(index, q);
      if (answer.kind !== 'unknown') continue;
      expect(answer.text, q).toMatch(/I don't know/);
      expect(answer.text, q).toMatch(/reach out to Chandrashekhar/);
      expect(answer.urls, q).toContain('/#contact');
    }
  });

  it('never speaks as Chandrashekhar ("I\'m", "my") in an answer about him', () => {
    for (const q of all()) {
      const { answer } = ask(index, q);
      expect(answer.text, q).not.toMatch(/\b(I'm|I've|my|me)\b/);
    }
  });

  it('answers first: yes/no questions lead with the verdict', () => {
    const { answer } = ask(index, 'Has he used PrimeNG?');
    expect(answer.text).toMatch(/^Yes, he has worked with PrimeNG\./);
  });

  it('hedges a weak keyword-only match instead of sounding sure', () => {
    // No entity or question type; only a few words match the data.
    const { answer } = ask(index, 'anything about pagination improvements?');
    if (answer.kind === 'answer') {
      expect(answer.text).toMatch(/may only partly answer|reach out to Chandrashekhar/);
    } else {
      expect(answer.kind).toBe('unknown');
    }
  });
});

describe('third person', () => {
  it('rewrites object and possessive pronouns, keeps the rest', async () => {
    const { thirdPerson } = await import('../src/compose');
    expect(thirdPerson("questions about me and my work; I'm learning")).toBe(
      "questions about him and his work; he's learning",
    );
  });
});

describe('follow-ups', () => {
  it('"yes" accepts the offer the previous answer made', () => {
    const first = ask(index, 'who is mahesh').answer;
    expect(first.suggest).toBe('Who is Chandrashekhar?');
    const next = ask(index, 'yes', { suggest: first.suggest }).answer;
    expect(next.kind).toBe('answer');
    expect(next.text).toContain('Software Engineer');
  });

  it('"yes" with nothing offered asks what they want to know', () => {
    const { answer } = ask(index, 'yes');
    expect(answer.kind).toBe('smalltalk');
    expect(answer.text).toMatch(/What would you like to know/);
  });
});
