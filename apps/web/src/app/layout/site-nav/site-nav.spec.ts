import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter } from '@angular/router';

import { provideContent } from '../../core/content/provide-content';
import { provideChat } from '../../features/chat/provide-chat';
import { SiteNav } from './site-nav';

describe('SiteNav', () => {
  it('shows the logo initials from content', async () => {
    await render(SiteNav, { providers: [provideRouter([]), provideContent(), provideChat()] });
    expect(screen.getByRole('link', { name: 'Home' }).textContent).toContain('CS');
  });

  it('opens and closes the mobile menu with aria-expanded', async () => {
    const { container } = await render(SiteNav, {
      providers: [provideRouter([]), provideContent(), provideChat()],
    });
    // jsdom can't apply the mobile media query, so the burger stays display:none and
    // has no accessible name here; select it by its relationship instead.
    // (The mobile e2e test finds it by role + name in a real browser.)
    const button = container.querySelector<HTMLButtonElement>('[aria-controls="mobile-menu"]');
    if (!button) throw new Error('burger button missing');

    expect(button.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('mobile-menu')).not.toBeNull();
    await userEvent.click(button);
    expect(document.getElementById('mobile-menu')).toBeNull();
  });
});
