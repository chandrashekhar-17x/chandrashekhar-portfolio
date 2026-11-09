import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { provideContent } from '../../core/content/provide-content';
import { ProjectPage, stripTitle } from './project-page';

describe('stripTitle', () => {
  it('removes a leading comment and "# Title" line, keeping the rest', () => {
    const md = '<!-- note -->\n\n# Title\n\n## Problem\n\nText';
    expect(stripTitle(md)).toBe('\n## Problem\n\nText');
  });

  it('leaves markdown without a title untouched', () => {
    expect(stripTitle('## Problem\n')).toBe('## Problem\n');
  });
});

describe('ProjectPage', () => {
  const setup = (slug: string) =>
    render(ProjectPage, {
      inputs: { slug },
      providers: [provideRouter([]), provideContent()],
    });

  it('renders exactly one h1 and the case-study sections', async () => {
    await setup('cad-editor');
    expect(await screen.findByRole('heading', { level: 2, name: 'Problem' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows a not-found message for an unknown slug', async () => {
    await setup('nope');
    expect(await screen.findByRole('heading', { name: 'Project not found' })).toBeTruthy();
  });
});

describe('ProjectPage tags', () => {
  it('shows skill names, not ids', async () => {
    await render(ProjectPage, {
      inputs: { slug: 'ai-portfolio' },
      providers: [provideRouter([]), provideContent()],
    });
    const tags = await screen.findByRole('list', { name: 'Technologies' });
    expect(tags.textContent).toContain('PostgreSQL');
    expect(tags.textContent).not.toContain('postgres ');
  });
});
