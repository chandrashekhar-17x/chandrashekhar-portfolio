import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_ORIGIN, TURNSTILE_SITE_KEY } from '../../core/seo/site-origin.gen';

/** API origin for the form (null = no backend yet: the form explains that honestly). */
export const CONTACT_API_ORIGIN = new InjectionToken<string | null>('CONTACT_API_ORIGIN', {
  factory: () => API_ORIGIN,
});
/** Public Turnstile site key (null = no bot-check widget, e.g. local dev). */
export const TURNSTILE_KEY = new InjectionToken<string | null>('TURNSTILE_KEY', {
  factory: () => TURNSTILE_SITE_KEY,
});

export interface ContactPayload {
  name: string;
  email: string;
  reason: string;
  message: string;
  website: string; // honeypot
  turnstile_token: string | null;
}

/** Posts the contact form to `POST /api/v1/contact` and turns errors into readable text. */
@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);
  private readonly origin = inject(CONTACT_API_ORIGIN);
  readonly enabled = this.origin !== null;

  /** Resolves when the API accepted the message; rejects with a message for the visitor. */
  async send(payload: ContactPayload): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.origin ?? ''}/api/v1/contact`, payload));
    } catch (err) {
      throw new Error(friendly(err), { cause: err });
    }
  }
}

function friendly(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const apiMessage = (err.error as { error?: { message?: string } } | null)?.error?.message;
    if ((err.status === 429 || err.status === 400) && apiMessage) return apiMessage;
    if (err.status === 422) return 'Please check the fields and try again.';
  }
  return 'Could not send right now. Please try again in a minute, or reach me on LinkedIn.';
}
