import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { provideContent } from '../../core/content/provide-content';
import { provideChat } from '../../features/chat/provide-chat';
import { HomePage } from './home-page';

describe('HomePage', () => {
  const setup = () =>
    render(HomePage, { providers: [provideRouter([]), provideContent(), provideChat()] });

  it('has exactly one h1, named with the owner and the hero title', async () => {
    await setup();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.getAttribute('aria-label')).toBe('Chandrashekhar — Frontend engineer → AI engineer.');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists every "I build" phrase for screen readers', async () => {
    await setup();
    expect(screen.getByText(/I build Angular apps that scale, CAD editors on canvas/)).toBeTruthy();
  });

  it('shows the stats including the computed graph size', async () => {
    await setup();
    expect(screen.getByText('Skills in the knowledge graph')).toBeTruthy();
    expect(screen.getByText('30+')).toBeTruthy();
  });
});
