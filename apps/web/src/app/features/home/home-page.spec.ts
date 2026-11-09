import { render, screen } from '@testing-library/angular';

import { provideContent } from '../../core/content/provide-content';
import { HomePage } from './home-page';

describe('HomePage', () => {
  it('shows one h1 with the owner name from content', async () => {
    await render(HomePage, { providers: [provideContent()] });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toContain('Chandrashekhar');
  });
});
