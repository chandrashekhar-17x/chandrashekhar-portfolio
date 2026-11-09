import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Magnetic } from '../../shared/ui/magnetic.directive';

export const CONTACT_REASONS = [
  { value: 'hiring', label: 'Hiring: full-time role' },
  { value: 'freelance', label: 'Freelance project' },
  { value: 'hello', label: 'Just saying hi' },
] as const;

/**
 * Contact form with client-side validation (typed reactive form).
 * Phase 1: nothing is sent. Phase 2 posts to /api/v1/contact (Turnstile + rate limit + email).
 */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, Magnetic],
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
  });
  protected readonly status = signal('');
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
    this.status.set(
      'Thanks! The form goes live soon. Nothing was sent yet, so please reach me on LinkedIn for now.',
    );
    this.form.reset();
  }
}
