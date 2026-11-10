import { marked } from 'marked';

// Splits a case-study markdown body into typed sections so the page can give
// some of them a richer layout. Pure functions: easy to test, SSR-safe.

interface Base {
  id: string; // anchor for the table of contents
  title: string;
}
export type Section =
  | (Base & { kind: 'tldr'; items: string[] })
  | (Base & { kind: 'chips'; groups: { label: string; items: string[] }[] })
  | (Base & { kind: 'problems'; rows: { challenge: string; approach: string }[] })
  | (Base & { kind: 'journey'; html: string })
  | (Base & { kind: 'html'; html: string });

/** "Hard problems & how I solved them" → "hard-problems-how-i-solved-them". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const plain = (s: string) => s.replace(/\*\*|__|\*/g, '').trim();
// Code blocks can scroll sideways on phones: tabindex lets keyboard users scroll them.
const toHtml = (md: string) =>
  marked.parse(md, { async: false }).replace(/<pre>/g, '<pre tabindex="0">');

/**
 * Every "## Heading" starts a section. Text before the first heading (e.g. the
 * confidentiality note) becomes an untitled "intro" block, left out of the TOC.
 */
export function parseCaseStudy(md: string): Section[] {
  const [intro = '', ...parts] = md.replace(/\r\n/g, '\n').split(/^## /m);
  const sections = parts.map((part) => {
    const newline = part.indexOf('\n');
    const title = (newline < 0 ? part : part.slice(0, newline)).trim();
    const body = newline < 0 ? '' : part.slice(newline + 1).trim();
    return toSection(title, body);
  });
  return intro.trim()
    ? [{ id: 'intro', title: '', kind: 'html', html: toHtml(intro.trim()) }, ...sections]
    : sections;
}

function toSection(title: string, body: string): Section {
  const base = { id: slugify(title), title };
  const lines = body.split('\n').map((l) => l.trim());

  if (/^tl;?dr$/i.test(title)) {
    return {
      ...base,
      kind: 'tldr',
      items: lines.filter((l) => l.startsWith('- ')).map((l) => plain(l.slice(2))),
    };
  }
  // "**Label:** a · b · c" lines → chip groups.
  const groups = lines
    .map((l) => /^\*\*([^*]+):\*\*\s*(.+)$/.exec(l))
    .filter((m): m is RegExpExecArray => m !== null);
  if (groups.length >= 2 && groups.length === lines.filter(Boolean).length) {
    return {
      ...base,
      kind: 'chips',
      groups: groups.map((m) => ({
        label: (m[1] ?? '').trim(),
        items: (m[2] ?? '').split('·').map(plain).filter(Boolean),
      })),
    };
  }
  // A two-column table → one card per row.
  const rows = lines.filter((l) => l.startsWith('|')).slice(2);
  if (rows.length && lines.filter(Boolean).every((l) => l.startsWith('|'))) {
    return {
      ...base,
      kind: 'problems',
      rows: rows.map((r) => {
        const [challenge = '', approach = ''] = r.split('|').slice(1, -1).map(plain);
        return { challenge, approach };
      }),
    };
  }
  if (/journey/i.test(title)) return { ...base, kind: 'journey', html: toHtml(body) };
  return { ...base, kind: 'html', html: toHtml(body) };
}
