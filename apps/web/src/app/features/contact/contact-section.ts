import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { ContactForm } from './contact-form';

/** Home section 05: contact form + recruiter fast-lane (lazy chunk). */
@Component({
  selector: 'app-contact-section',
  imports: [Reveal, ContactForm, RouterLink],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  protected readonly profile = toSignal(inject(ContentRepository).profile());
}
