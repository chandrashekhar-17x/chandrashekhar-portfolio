import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Magnetic } from '../../shared/ui/magnetic.directive';
import { ContactApi, TURNSTILE_KEY } from './contact-api';
import { TurnstileWidget } from './turnstile-widget';

export const CONTACT_REASONS = [
  { value: 'hiring', label: 'Hiring: full-time role' },
  { value: 'freelance', label: 'Freelance project' },
  { value: 'hello', label: 'Just saying hi' },
] as const;

/**
 * Contact form with client-side validation (typed reactive form).
 * With an API (PUBLIC_API_URL at build time) it posts to /api/v1/contact, which
 * rate-limits, checks Turnstile and emails the owner; without one it says so honestly.
 */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, Magnetic, TurnstileWidget],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactForm {
  protected readonly reasons = CONTACT_REASONS;
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    reason: new FormControl<(typeof CONTACT_REASONS)[number]['value']>('hiring', {
      nonNullable: true,
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
    }),
    // Honeypot: visually hidden, skipped by keyboard and screen readers; bots fill it.
    website: new FormControl('', { nonNullable: true }),
  });
  protected readonly status = signal('');
  protected readonly sending = signal(false);
  protected readonly siteKey = inject(TURNSTILE_KEY);
  private readonly api = inject(ContactApi);
  private readonly token = signal<string | null>(null);
  private readonly turnstile = viewChild(TurnstileWidget);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Error text for a field, or '' when valid / not yet touched. */
  protected error(field: 'name' | 'email' | 'message'): string {
    const c = this.form.controls[field];
    if (!c.touched || c.valid) return '';
    if (c.hasError('required')) return 'This field is required.';
    if (c.hasError('email')) return 'Please enter a valid email address.';
    if (c.hasError('minlength')) return 'Please write at least 10 characters.';
    if (c.hasError('maxlength')) return 'That is too long.';
    return 'Please check this field.';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status.set('');
      // Move focus to the first problem so keyboard and screen-reader users land on it.
      queueMicrotask(() => {
        this.host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    if (!this.api.enabled) {
      this.status.set(
        'Thanks! The form goes live soon. Nothing was sent yet, so please reach me on LinkedIn for now.',
      );
      this.form.reset();
      return;
    }
    void this.send();
  }

  protected onToken(token: string | null): void {
    this.token.set(token);
  }

  private async send(): Promise<void> {
    if (this.sending()) return;
    if (this.siteKey && !this.token()) {
      this.status.set('One moment: the spam check is still loading. Please try again.');
      return;
    }
    this.sending.set(true);
    this.status.set('Sending…');
    try {
      await this.api.send({ ...this.form.getRawValue(), turnstile_token: this.token() });
      this.status.set("Thanks! Your message was sent. I'll reply by email soon.");
      this.form.reset();
    } catch (err) {
      this.status.set(err instanceof Error ? err.message : 'Could not send right now.');
    } finally {
      this.sending.set(false);
      this.turnstile()?.reset(); // tokens are single-use
    }
  }
}
