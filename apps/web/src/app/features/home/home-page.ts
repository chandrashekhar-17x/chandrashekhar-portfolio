import { ChangeDetectionStrategy, Component } from '@angular/core';

// Phase 0 placeholder. Phase 1 replaces it with the real home sections
// (hero, graph, work, lab, experience, contact), each behind @defer (on viewport).
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
