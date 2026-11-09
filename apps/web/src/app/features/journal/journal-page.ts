import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /journal: being built in Phase 1 (see docs/backlog.md). */
@Component({
  selector: 'app-journal-page',
  imports: [PageHeader],
  template: `<app-page-header
    eyebrow="Journal"
    title="Learning in public."
    lead="Dated notes on Python, FastAPI, RAG and agents. Coming soon."
  />`,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalPage {}
