import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Profile } from '../../core/content/content.types.gen';
import { Magnetic } from '../../shared/ui/magnetic.directive';
import { HeroCanvas } from './hero-canvas';
import { HeroOrb } from './hero-orb';
import { HeroTitle } from './hero-title';
import { Typewriter } from './typewriter.component';

/** First screen: canvas background, availability, title, typed roles, CTAs. */
@Component({
  selector: 'app-hero-section',
  imports: [RouterLink, HeroCanvas, HeroOrb, HeroTitle, Typewriter, Magnetic],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  readonly profile = input.required<Profile>();
}
