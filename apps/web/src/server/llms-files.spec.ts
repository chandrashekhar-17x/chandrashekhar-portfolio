import { LlmsInput, llmsFullTxt, llmsTxt, stripFrontMatter } from './llms-files';

const input: LlmsInput = {
  siteUrl: 'https://example.dev',
  profile: {
    name: 'Ada',
    title: 'Engineer',
    headline: 'Builds things.',
    bio: ['First paragraph.'],
    locationShort: 'Hyderabad, India',
    links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
  },
  projects: [
    { slug: 'cad', title: 'CAD editor', summary: 'Draws.', type: 'professional', period: '2026' },
    { slug: 'voice', title: 'Voice', summary: 'Talks.', type: 'personal', status: 'planned' },
  ],
  roles: [
    {
      org: 'acme',
      title: 'Engineer',
      start: '2023-01',
      end: '2023-07',
      employmentType: 'internship',
    },
    { org: 'acme', title: 'Engineer', start: '2024-01' },
  ],
  organizations: [{ id: 'acme', name: 'Acme' }],
  skills: [
    { name: 'Angular', proficiency: 'strong' },
    { name: 'Rust', proficiency: 'learning' },
  ],
};

describe('llms.txt', () => {
  const txt = llmsTxt(input);

  it('follows the llmstxt.org shape: H1, quote summary, H2 link lists', () => {
    expect(txt.startsWith('# Ada\n\n> Engineer, Hyderabad, India. Builds things.\n')).toBe(true);
    expect(txt).toContain('## Optional\n\n- [GitHub](https://github.com/ada)');
  });

  it('lists work with absolute links, newest role first, strong skills only', () => {
    expect(txt).toContain('- [CAD editor](https://example.dev/work/cad) (2026): Draws.');
    expect(txt).toContain('- [Voice](https://example.dev/work/voice) (planned): Talks.');
    expect(txt.indexOf('- Engineer, Acme (2024-01 to present)')).toBeLessThan(
      txt.indexOf('- Intern, Acme (2023-01 to 2023-07)'),
    );
    expect(txt).toContain('\nAngular\n');
    expect(txt).not.toContain('Rust');
  });

  it('has no blank-line runs and ends with one newline', () => {
    expect(txt).not.toMatch(/\n{3}/);
    expect(txt.endsWith('\n') && !txt.endsWith('\n\n')).toBe(true);
  });
});

describe('llms-full.txt', () => {
  it('appends each case study without front matter, headings demoted', () => {
    const md = '---\nslug: cad\nsecret: x\n---\n\n## TL;DR\n\nFast.\n';
    const full = llmsFullTxt(input, new Map([['cad', md]]));
    expect(full).toContain('# Case study: CAD editor\n\nSource: https://example.dev/work/cad');
    expect(full).toContain('### TL;DR\n\nFast.');
    expect(full).not.toContain('secret: x');
    expect(full).not.toContain('Case study: Voice');
  });

  it('stripFrontMatter leaves plain markdown alone', () => {
    expect(stripFrontMatter('# Hi\n')).toBe('# Hi\n');
  });
});
