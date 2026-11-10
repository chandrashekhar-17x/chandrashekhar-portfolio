import { parseCaseStudy, slugify } from './case-study';

const MD = `> Employer project note.
## TL;DR
- Started with **zero** CAD background.
- Shipped a custom editor.

## My R&D journey
1. **Approach 1: x** · ✗

## What I built
**Rendering engine:** line · arc · **text**
**Editing:** move · undo/redo

## Hard problems & how I solved them
| Challenge | Approach |
| --- | --- |
| Accurate text | Custom rendering |
| Fast selection | R-tree index |

## Outcome
Plain *markdown*.`;

describe('parseCaseStudy', () => {
  const sections = parseCaseStudy(MD);

  it('keeps the intro as an untitled block and splits on ## headings', () => {
    expect(sections[0]).toMatchObject({ id: 'intro', title: '', kind: 'html' });
    expect(sections.slice(1).map((s) => s.id)).toEqual([
      'tl-dr',
      'my-r-d-journey',
      'what-i-built',
      'hard-problems-how-i-solved-them',
      'outcome',
    ]);
    expect(slugify('TL;DR')).toBe('tl-dr');
  });

  it('gives TL;DR, chip groups and the problems table their own shapes', () => {
    expect(sections.slice(1).map((s) => s.kind)).toEqual([
      'tldr',
      'journey',
      'chips',
      'problems',
      'html',
    ]);
    const [, tldr, , chips, problems, html] = sections;
    expect(tldr?.kind === 'tldr' && tldr.items[0]).toBe('Started with zero CAD background.');
    expect(chips?.kind === 'chips' && chips.groups[0]).toEqual({
      label: 'Rendering engine',
      items: ['line', 'arc', 'text'],
    });
    expect(problems?.kind === 'problems' && problems.rows).toEqual([
      { challenge: 'Accurate text', approach: 'Custom rendering' },
      { challenge: 'Fast selection', approach: 'R-tree index' },
    ]);
    expect(html?.kind === 'html' && html.html).toContain('<em>markdown</em>');
    const [code] = parseCaseStudy('## Architecture\n```\na → b\n```');
    expect(code?.kind === 'html' && code.html).toContain('<pre tabindex="0">');
  });
});
