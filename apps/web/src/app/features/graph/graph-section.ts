import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { GraphExplorer } from './graph-explorer';

/** Home section 01 (lazy chunk, loaded by @defer in the home page). */
@Component({
  selector: 'app-graph-section',
  imports: [Reveal, GraphExplorer],
  template: `
    <app-reveal kind="graph" label="knowledge graph">
      <ng-template>
        <div class="section-head reveal-item" style="--i: 0">
          <div>
            <p class="section-index">01 / knowledge graph</p>
            <h2>Everything I know,<br />connected.</h2>
          </div>
          <p>
            Skills, projects and roles as one living network: the same data that powers my AI agent.
            Hover a node, drag it, or filter.
          </p>
        </div>
        @if (graph(); as g) {
          <app-graph-explorer class="reveal-item" style="--i: 1" [graph]="g" />
        }
      </ng-template>
    </app-reveal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphSection {
  protected readonly graph = toSignal(inject(ContentRepository).graph());
}
