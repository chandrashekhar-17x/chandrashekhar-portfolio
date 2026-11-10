import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { GraphFilters } from './graph-filters';

describe('GraphFilters', () => {
  it('shows only categories that have nodes, with counts, and emits toggles', async () => {
    const graph = await firstValueFrom(new MockContentRepository().graph());
    const picked: unknown[] = [];
    const on = { activeChange: (v: unknown) => picked.push(v) };
    const { rerender } = await render(GraphFilters, { inputs: { graph, active: null }, on });

    const projects = screen.getByRole('button', { name: /Projects\s*11/ });
    await userEvent.click(projects);
    expect(picked).toEqual(['project']);

    // rerender replaces listeners, so pass them again.
    await rerender({ inputs: { graph, active: 'project' }, on, partialUpdate: true });
    expect(projects.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(projects);
    expect(picked).toEqual(['project', null]); // clicking the active one clears it
  });
});
