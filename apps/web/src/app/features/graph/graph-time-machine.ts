import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { KnowledgeGraph } from '../../core/content/build-graph';
import { ContentRepository } from '../../core/content/content-repository';
import { formatMonth, toYearMonth } from '../../core/time/duration';
import {
  NOW,
  When,
  futureAt,
  milestoneAt,
  milestones,
  monthsBetween,
  nodeStarts,
} from './time-machine';

/** ms per month while playing (2020 → today in ~7 s). */
const STEP_MS = 85;

/**
 * Career time machine: scrub (or play) from 2020 to today and watch the graph
 * grow as degrees, jobs and projects arrive. Emits the ids that don't exist yet.
 */
@Component({
  selector: 'app-graph-time-machine',
  template: `
    <div class="tm" role="group" aria-label="Career time machine">
      <button
        type="button"
        class="play"
        [attr.aria-label]="playing() ? 'Pause' : 'Play my career from ' + firstYear()"
        (click)="toggle()"
      >
        {{ playing() ? '❚❚' : '▶' }}
      </button>
      <input
        type="range"
        min="0"
        [max]="steps().length - 1"
        [value]="index()"
        aria-label="Career time machine"
        [attr.aria-valuetext]="label() + (caption() ? ': ' + caption() : '')"
        (input)="onInput($event)"
      />
      <p class="when">
        <b>{{ label() }}</b>
        <span class="caption">{{ caption() }}</span>
        <span class="count">{{ shown() }}/{{ graph().nodes.length }} nodes</span>
      </p>
    </div>
  `,
  styleUrl: './graph-time-machine.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphTimeMachine {
  readonly graph = input.required<KnowledgeGraph>();
  /** Ids hidden at the chosen date (empty at "Today"). */
  readonly futureChange = output<ReadonlySet<string>>();

  private readonly repo = inject(ContentRepository);
  private readonly projects = toSignal(this.repo.projects(), { initialValue: [] });
  private readonly experience = toSignal(this.repo.experience());
  private readonly education = toSignal(this.repo.education(), { initialValue: [] });

  private readonly data = computed(() => {
    const experience = this.experience();
    return experience
      ? { projects: this.projects(), experience, education: this.education() }
      : null;
  });
  private readonly starts = computed(() => {
    const data = this.data();
    return data ? nodeStarts(this.graph(), data) : new Map<string, string | null>();
  });
  private readonly story = computed(() => {
    const data = this.data();
    return data ? milestones(data) : [];
  });

  /** Every month from the first dated event to this month, then "now". */
  protected readonly steps = computed<When[]>(() => {
    const dated = [...this.starts().values()].filter((m): m is string => !!m).sort();
    const first = dated[0] ?? toYearMonth();
    return [...monthsBetween(first, toYearMonth()), NOW];
  });
  /** -1 = the last step (today), so new months never move the thumb off "now". */
  private readonly picked = signal(-1);
  protected readonly index = computed(() =>
    this.picked() < 0 ? this.steps().length - 1 : Math.min(this.picked(), this.steps().length - 1),
  );
  private readonly when = computed(() => this.steps()[this.index()] ?? NOW);
  private readonly future = computed(() => futureAt(this.starts(), this.when()));

  protected readonly firstYear = computed(() => (this.steps()[0] ?? '').slice(0, 4));
  protected readonly label = computed(() => {
    const w = this.when();
    return w === NOW ? 'Today' : formatMonth(w);
  });
  protected readonly caption = computed(() => milestoneAt(this.story(), this.when())?.text ?? '');
  protected readonly shown = computed(() => this.graph().nodes.length - this.future().size);

  protected readonly playing = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => {
      this.futureChange.emit(this.future());
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
  }

  protected onInput(event: Event): void {
    this.stop();
    const i = Number((event.target as HTMLInputElement).value);
    this.picked.set(i >= this.steps().length - 1 ? -1 : i);
  }

  protected toggle(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    // From "today", play starts at the beginning.
    if (this.picked() < 0) this.picked.set(0);
    this.playing.set(true);
    this.timer = setInterval(() => {
      const next = this.index() + 1;
      if (next >= this.steps().length - 1) {
        this.picked.set(-1);
        this.stop();
      } else {
        this.picked.set(next);
      }
    }, STEP_MS);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.playing.set(false);
  }
}
