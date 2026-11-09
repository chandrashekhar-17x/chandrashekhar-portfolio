import { render, screen, within } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { GraphList } from './graph-list';

describe('GraphList', () => {
  it('groups nodes by category and lists connections without hub names', async () => {
    const graph = await firstValueFrom(new MockContentRepository().graph());
    await render(GraphList, { inputs: { graph } });

    const projects = screen.getByRole('heading', { name: /Projects \(\d+\)/ }).closest('section');
    if (!projects) throw new Error('no projects group');
    const cad = within(projects).getByText('Canvas CAD Editor').closest('li');
    expect(cad?.textContent).toContain('Angular');
    expect(cad?.textContent).not.toContain('FRONTEND');
  });

  it('keeps all-caps skill names like RAG (only hubs are hidden)', async () => {
    const graph = await firstValueFrom(new MockContentRepository().graph());
    await render(GraphList, { inputs: { graph } });
    expect(screen.getAllByText('RAG').length).toBeGreaterThan(0);
  });
});
