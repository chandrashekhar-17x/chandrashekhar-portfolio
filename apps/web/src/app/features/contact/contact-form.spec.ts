import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONTACT_API_ORIGIN } from './contact-api';
import { ContactForm } from './contact-form';

async function fillValid(): Promise<void> {
  await userEvent.type(screen.getByRole('textbox', { name: /name/ }), 'Ada');
  await userEvent.type(screen.getByRole('textbox', { name: /email/ }), 'ada@example.com');
  await userEvent.type(screen.getByRole('textbox', { name: /message/ }), 'Hello, nice portfolio!');
}

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

  describe('with an API', () => {
    const renderWithApi = () =>
      render(ContactForm, {
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: CONTACT_API_ORIGIN, useValue: 'https://api.example.dev' },
        ],
      });

    it('posts to /api/v1/contact and confirms', async () => {
      await renderWithApi();
      await fillValid();
      await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

      const req = TestBed.inject(HttpTestingController).expectOne(
        'https://api.example.dev/api/v1/contact',
      );
      expect(req.request.body).toMatchObject({ name: 'Ada', reason: 'hiring', website: '' });
      req.flush({ status: 'received' }, { status: 202, statusText: 'Accepted' });

      await vi.waitFor(() => {
        expect(screen.getByRole('status').textContent).toContain('Your message was sent');
      });
    });

    it("shows the API's rate-limit message", async () => {
      await renderWithApi();
      await fillValid();
      await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

      TestBed.inject(HttpTestingController)
        .expectOne('https://api.example.dev/api/v1/contact')
        .flush(
          { error: { code: 'TOO_MANY_REQUESTS', message: 'Try again in 42 min.' } },
          { status: 429, statusText: 'Too Many Requests' },
        );

      await vi.waitFor(() => {
        expect(screen.getByRole('status').textContent).toContain('Try again in 42 min.');
      });
      // The text stays, so the visitor doesn't lose what they wrote.
      expect(screen.getByRole<HTMLInputElement>('textbox', { name: /name/ }).value).toBe('Ada');
    });
  });
});
