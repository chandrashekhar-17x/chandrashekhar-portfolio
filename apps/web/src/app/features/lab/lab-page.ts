import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /lab: being built in Phase 1 (see docs/backlog.md). */
@Component({
  selector: 'app-lab-page',
  imports: [PageHeader],
  template: `<app-page-header
    eyebrow="AI Lab"
    title="Meet the agents behind this site."
    lead="A live look at the AI system that answers for me. Arrives with the AI phases."
  />`,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabPage {}
