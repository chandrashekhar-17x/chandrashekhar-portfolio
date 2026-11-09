import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /resume: being built in Phase 1 (see docs/backlog.md). */
@Component({
  selector: 'app-resume-page',
  imports: [PageHeader],
  template: `<app-page-header
    eyebrow="Resume"
    title="Resume."
    lead="An HTML resume and a PDF download."
  />`,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePage {}
