import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { provideContent } from '../../core/content/provide-content';
import { provideChat } from '../chat/provide-chat';
import { ProjectPage, stripTitle } from './project-page';

describe('stripTitle', () => {
  it('removes a leading comment and "# Title" line, keeping the rest', () => {
    const md = '<!-- note -->\n\n# Title\n\n## Problem\n\nText';
    expect(stripTitle(md)).toBe('\n## Problem\n\nText');
  });

  it('removes YAML frontmatter', () => {
    expect(stripTitle('---\nslug: x\ntitle: T\n---\n\n## TL;DR\n')).toBe('## TL;DR\n');
  });

  it('leaves markdown without a title untouched', () => {
    expect(stripTitle('## Problem\n')).toBe('## Problem\n');
  });
});

// Like HomePage, the first Angular render can exceed 5 s on a busy CI runner.
describe('ProjectPage', { timeout: 20_000 }, () => {
  const setup = (slug: string) =>
    render(ProjectPage, {
      inputs: { slug },
      providers: [provideRouter([]), provideContent(), provideChat()],
    });

  it('renders exactly one h1 and the case-study sections', async () => {
    await setup('custom-cad-editor');
    expect(await screen.findByRole('heading', { level: 2, name: 'TL;DR' })).toBeTruthy();
    expect(screen.queryByText(/^slug:/)).toBeNull(); // frontmatter is not rendered
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows a not-found message for an unknown slug', async () => {
    await setup('nope');
    expect(await screen.findByRole('heading', { name: 'Project not found' })).toBeTruthy();
  });
});

describe('ProjectPage facts', () => {
  it('labels employer work honestly and shows no repo links', async () => {
    await render(ProjectPage, {
      inputs: { slug: 'progressive-pdf-viewer' },
      providers: [provideRouter([]), provideContent(), provideChat()],
    });
    const tags = await screen.findByRole('list', { name: 'Technologies' });
    expect(tags.textContent).toContain('PDF.js');
    expect(screen.getByText(/^Professional · details anonymised/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Code/ })).toBeNull();
  });
});
