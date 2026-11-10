import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { GraphExplorer } from './graph-explorer';

/** /graph: the knowledge graph full-screen, with the same list view for accessibility. */
@Component({
  selector: 'app-graph-page',
  imports: [PageHeader, GraphExplorer],
  template: `
    <app-page-header
      eyebrow="Knowledge graph"
      title="Everything I know, connected."
      lead="Skills, projects and roles as one network. Drag, hover and filter, or switch to the list view."
    />
    @if (graph(); as g) {
      <app-graph-explorer [graph]="g" [tall]="true" />
    }
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphPage {
  protected readonly graph = toSignal(inject(ContentRepository).graph());
}
