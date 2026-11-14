import { type Entity, linkEntities } from './entities';
import type { Chunk } from './types';

// content/resume/resume.html → chunks: the summary, one chunk per job bullet, one
// per skills row, plus education and certifications. The resume holds a few facts
// the site data doesn't (auth, dynamic forms, certifications), so it is indexed too.

const ENTITIES: Record<string, string> = {
  amp: '&',
  nbsp: ' ',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
};

export function htmlText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|nbsp|lt|gt|quot|#39);/g, (_, e: string) => ENTITIES[e] ?? ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .trim();
}

export function resumeChunks(html: string, entities: readonly Entity[]): Chunk[] {
  const body = html.replace(/<style[\s\S]*?<\/style>/g, '');
  const out: Chunk[] = [];
  const add = (id: string, title: string, text: string, extra: string[] = []) => {
    const nodes = [...new Set([...extra, ...linkEntities(text, entities)])];
    out.push({
      id: `resume:${id}`,
      kind: 'resume',
      title: `Resume: ${title}`,
      text,
      nodes,
      url: '/resume',
    });
  };

  const sections = body.split(/<h2>/).slice(1);
  for (const section of sections) {
    const heading = htmlText(section.split('</h2>')[0] ?? '');
    const rest = section.slice(section.indexOf('</h2>') + 5);
    const key = heading.toLowerCase().replace(/[^a-z]+/g, '-');

    const jobs = rest.match(/<section class="job">[\s\S]*?<\/section>/g);
    if (jobs) {
      jobs.forEach((job, j) => {
        const header = htmlText((job.match(/<header>([\s\S]*?)<\/header>/) ?? [])[1] ?? '');
        const items = job.match(/<li>([\s\S]*?)<\/li>/g) ?? [];
        items.forEach((li, i) => {
          // The job header names the company: link the bullet to it.
          const org = linkEntities(header, entities).filter((n) => n.startsWith('org:'));
          add(`${key}-${String(j + 1)}-${String(i + 1)}`, header, htmlText(li), org);
        });
      });
      continue;
    }
    const pairs = [...rest.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)];
    if (pairs.length) {
      for (const [, dt = '', dd = ''] of pairs) {
        const name = htmlText(dt);
        add(
          `skills-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
          `${name} skills`,
          `${name} skills: ${htmlText(dd)}`,
        );
      }
      continue;
    }
    const text = htmlText(rest);
    if (text) add(key, heading, `${heading}: ${text}`);
  }
  return out;
}
