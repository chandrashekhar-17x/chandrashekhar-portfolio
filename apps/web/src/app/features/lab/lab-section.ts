import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Reveal } from '../../shared/ui/reveal/reveal';
import { LabHud } from './lab-hud';

/** Home section 03: the AI Lab HUD (lazy chunk). */
@Component({
  selector: 'app-lab-section',
  imports: [Reveal, LabHud],
  template: `
    <app-reveal kind="lab" label="AI lab">
      <ng-template>
        <div class="section-head reveal-item" style="--i: 0">
          <div>
            <p class="section-index">03 / AI lab</p>
            <h2>Meet the agents<br />behind this site.</h2>
          </div>
          <p>
            A look at the AI system that answers for me, grounded in my real CV data, with voice.
          </p>
        </div>
        <app-lab-hud class="reveal-item" style="--i: 1" />
      </ng-template>
    </app-reveal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabSection {}
