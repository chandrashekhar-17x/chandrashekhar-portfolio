import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { provideContent } from '../../core/content/provide-content';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
import { AboutSection } from './about-section';

describe('AboutSection', () => {
  const setup = () => render(AboutSection, { providers: [provideRouter([]), provideContent()] });

  it('shows the bio, 7 area cards with skill names and the How I work steps', async () => {
    await setup();
    expect(screen.getByText(/3\+ years of experience in frontend development/)).toBeTruthy();
    const areas = screen.getByRole('list', { name: 'Areas of experience' });
    expect(areas.querySelectorAll(':scope > li')).toHaveLength(7);
    expect(screen.getByText('Three.js')).toBeTruthy(); // names, not ids
    expect(screen.getAllByText('growing')).toHaveLength(1); // backend only
    expect(screen.getByRole('heading', { name: 'How I work' })).toBeTruthy();
    expect(screen.getByText(/Research/)).toBeTruthy();
  });

  it('clicking a card filters the knowledge graph to its cluster', async () => {
    const { fixture } = await setup();
    await userEvent.click(
      screen.getByRole('button', { name: 'CAD & visualization: show in the knowledge graph' }),
    );
    expect(fixture.debugElement.injector.get(GraphHighlightService).filter()).toBe('cad');
  });
});
