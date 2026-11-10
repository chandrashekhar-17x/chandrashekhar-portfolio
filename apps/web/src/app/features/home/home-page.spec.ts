import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { provideContent } from '../../core/content/provide-content';
import { provideChat } from '../../features/chat/provide-chat';
import { HomePage } from './home-page';

// Renders the whole home page (hero, canvas, stats): the first, cold render can take >5 s in CI.
describe('HomePage', { timeout: 20_000 }, () => {
  const setup = () =>
    render(HomePage, { providers: [provideRouter([]), provideContent(), provideChat()] });

  it('has exactly one h1, named with the owner and the hero title', async () => {
    await setup();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.getAttribute('aria-label')).toBe('Chandrashekhar — Software Engineer Frontend → AI.');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists every "I build" phrase for screen readers', async () => {
    await setup();
    expect(
      screen.getByText(/I build custom CAD editors in Three.js, DXF rendering engines/),
    ).toBeTruthy();
  });

  it('shows the stats with years of experience computed from role dates', async () => {
    await setup();
    expect(screen.getByText('years of experience')).toBeTruthy();
    expect(screen.getByText(/^\d+\+$/)).toBeTruthy(); // "3+", never a typed-in number
    expect(screen.getByText('DXF entity types + tables')).toBeTruthy();
  });
});
