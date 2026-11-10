import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { AreaOfExperience } from '../../core/content/content.types.gen';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
import { AreaIcon } from './area-icon';

/**
 * Home section 01: long bio, "areas of experience" cards and "How I work".
 * Server-rendered (no @defer): it is mostly text that search engines should read.
 * Clicking a card filters the knowledge graph to that cluster and scrolls to it.
 */
@Component({
  selector: 'app-about-section',
  imports: [AreaIcon],
  templateUrl: './about-section.html',
  styleUrl: './about-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  private readonly repo = inject(ContentRepository);
  private readonly graph = inject(GraphHighlightService);
  private readonly router = inject(Router);

  protected readonly profile = toSignal(this.repo.profile());
  protected readonly about = toSignal(this.repo.about());
  private readonly skills = toSignal(this.repo.skills(), { initialValue: [] });

  /** Skill id → display name, for the chips. */
  protected readonly skillName = computed(() => {
    const names = new Map(this.skills().map((s) => [s.id, s.name]));
    return (id: string) => names.get(id) ?? id;
  });

  protected showInGraph(area: AreaOfExperience): void {
    this.graph.filter.set(area.hub);
    void this.router.navigate(['/'], { fragment: 'graph' });
  }
}
