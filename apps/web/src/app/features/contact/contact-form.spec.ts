import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ContactForm } from './contact-form';

describe('ContactForm', () => {
  it('shows errors on submit and moves focus to the first invalid field', async () => {
    await render(ContactForm);
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

    const name = screen.getByRole('textbox', { name: /name/ });
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getAllByText('This field is required.').length).toBe(3);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(name);
    });
  });

  it('validates the email format and message length', async () => {
    await render(ContactForm);
    await userEvent.type(screen.getByRole('textbox', { name: /email/ }), 'not-an-email');
    await userEvent.type(screen.getByRole('textbox', { name: /message/ }), 'short');
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Please write at least 10 characters.')).toBeTruthy();
  });

  it('accepts a valid message, confirms honestly and resets', async () => {
    await render(ContactForm);
    await userEvent.type(screen.getByRole('textbox', { name: /name/ }), 'Ada');
    await userEvent.type(screen.getByRole('textbox', { name: /email/ }), 'ada@example.com');
    await userEvent.type(
      screen.getByRole('textbox', { name: /message/ }),
      'Hello, nice portfolio!',
    );
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

    expect(screen.getByRole('status').textContent).toContain('Nothing was sent yet');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: /name/ }).value).toBe('');
  });
});
