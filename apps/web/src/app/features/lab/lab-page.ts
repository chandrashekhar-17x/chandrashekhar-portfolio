import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeader } from '../../shared/ui/page-header/page-header';
import { LabHud } from './lab-hud';

/** /lab: the AI Lab. Today a demo HUD; Phase 6 adds live status and voice mode. */
@Component({
  selector: 'app-lab-page',
  imports: [PageHeader, LabHud],
  template: `
    <app-page-header
      eyebrow="AI Lab"
      title="Meet the agents behind this site."
      lead="Agent status, model routing and my learning path. Live data and voice mode arrive in a later phase; the status shown here is a demo."
    />
    <app-lab-hud />
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabPage {}
