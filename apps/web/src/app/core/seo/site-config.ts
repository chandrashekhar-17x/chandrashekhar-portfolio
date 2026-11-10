import { InjectionToken } from '@angular/core';
import { SITE_ORIGIN } from './site-origin.gen';

export interface SiteConfig {
  /** Public origin, no trailing slash. PLACEHOLDER domain until one is bought. */
  url: string;
  name: string;
  description: string;
  /** Default social preview image (1200×630), path on the site. */
  ogImage: string;
}

export const SITE_CONFIG = new InjectionToken<SiteConfig>('SITE_CONFIG', {
  factory: () => ({
    url: SITE_ORIGIN,
    name: 'Chandrashekhar',
    description:
      'Frontend engineer who builds complex UIs (CAD/DXF viewers, PDF engines, data-extraction tools), now building the AI systems behind them.',
    ogImage: '/og/default.jpg',
  }),
});
