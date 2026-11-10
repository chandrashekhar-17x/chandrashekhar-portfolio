import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { Project, Skill } from '../../core/content/content.types.gen';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { ProjectCard, projectArea } from './project-card';

const skills = new Map<string, Skill>(
  (
    [
      ['angular', 'Angular', 'frontend'],
      ['ts', 'TypeScript', 'frontend'],
      ['rag', 'RAG', 'ai'],
      ['llms', 'LLM APIs', 'ai'],
      ['py', 'Python', 'backend'],
    ] as const
  ).map(([id, name, category]) => [id, { id, name, category, proficiency: 'strong' }]),
);

const project = (ids: string[]): Project => ({
  slug: 'demo',
  title: 'Demo Project',
  summary: 'A demo.',
  type: 'personal',
  status: 'shipped',
  featured: true,
  skills: ids,
  tags: ['RAG', 'LLM APIs', 'Angular', 'Extra'],
  filters: ['ai'],
  body: 'projects/demo.md',
  illustration: 'rag',
});

describe('projectArea', () => {
  it('picks the most common category among the skills', () => {
    expect(projectArea(project(['angular', 'ts', 'rag']), skills)).toBe('frontend');
  });

  it('breaks ties in favour of AI work', () => {
    expect(projectArea(project(['angular', 'ts', 'rag', 'llms']), skills)).toBe('ai');
  });

  it('falls back to frontend when skills are unknown', () => {
    expect(projectArea(project(['nope']), skills)).toBe('frontend');
  });
});

describe('ProjectCard', () => {
  const setup = (staggered: boolean) =>
    render(ProjectCard, {
      inputs: { project: project(['rag', 'llms', 'angular']), skills, staggered },
      providers: [
        provideRouter([]),
        { provide: MediaPrefs, useValue: { reducedMotion: signal(true), richMotion: false } },
      ],
    });

  it('is one link to the case study, named by the title', async () => {
    await setup(false);
    const link = screen.getByRole('link', { name: 'Demo Project' });
    expect(link.getAttribute('href')).toBe('/work/demo');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows the kind, the area tag and the first three display tags', async () => {
    await setup(false);
    expect(screen.getByText('Personal · open source')).toBeTruthy();
    const tags = screen.getByRole('list', { name: 'Technologies' }).textContent;
    expect(tags).toContain('ai');
    expect(tags).toContain('RAG');
    expect(tags).not.toContain('Extra');
  });

  it('staggered cards end up loaded once their turn comes', async () => {
    const { container } = await setup(true);
    await screen.findByRole('link', { name: 'Demo Project' });
    await vi.waitFor(() => {
      expect(container.querySelector('.card.is-loading')).toBeNull();
    });
  });
});
