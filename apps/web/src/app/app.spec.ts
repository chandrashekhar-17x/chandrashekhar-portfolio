import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { provideContent } from './core/content/provide-content';

describe('App shell', () => {
  it('renders a skip link that targets the main landmark', async () => {
    await render(App, { providers: [provideRouter([]), provideContent()] });

    expect(screen.getByText('Skip to content').getAttribute('href')).toBe('#main');
    expect(screen.getByRole('main').id).toBe('main');
  });

  it('has a main navigation with links to every home section', async () => {
    await render(App, { providers: [provideRouter([]), provideContent()] });

    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const label of ['Knowledge graph', 'Work', 'AI Lab', 'Experience', 'Contact']) {
      expect(nav.textContent).toContain(label);
    }
  });
});
