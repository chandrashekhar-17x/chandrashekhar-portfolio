import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Floating glowing orb with two tilted rings (pure CSS, decorative). */
@Component({
  selector: 'app-hero-orb',
  template: `<div class="ring"></div>
    <div class="ring r2"></div>
    <div class="orb"></div>`,
  styles: `
    :host {
      position: absolute;
      top: 50%;
      right: 6%;
      z-index: 1;
      width: 260px;
      height: 260px;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .orb {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(
        circle at 35% 30%,
        #fff 0%,
        var(--cyan) 12%,
        var(--violet) 45%,
        transparent 70%
      );
      filter: blur(1px);
      opacity: 0.75;
      animation: float 7s ease-in-out infinite;
    }
    .ring {
      position: absolute;
      inset: -20px;
      border: 1px solid color-mix(in oklab, var(--cyan) 40%, transparent);
      border-radius: 50%;
      transform: rotateX(70deg);
      animation: spin 12s linear infinite;
    }
    .r2 {
      inset: -50px;
      border-color: color-mix(in oklab, var(--violet) 40%, transparent);
      animation-duration: 18s;
      animation-direction: reverse;
    }
    @keyframes float {
      50% {
        transform: translateY(-14px) scale(1.03);
      }
    }
    @keyframes spin {
      to {
        transform: rotateX(70deg) rotateZ(360deg);
      }
    }
    @container site (max-width: 900px) {
      :host {
        right: -40px;
        opacity: 0.35;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .orb,
      .ring {
        animation: none;
      }
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroOrb {}
