import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /graph: being built in Phase 1 (see docs/backlog.md). */
@Component({
  selector: 'app-graph-page',
  imports: [PageHeader],
  template: `<app-page-header
    eyebrow="Knowledge graph"
    title="Everything I know, connected."
    lead="A full-screen version of the graph, with an accessible list view."
  />`,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphPage {}
