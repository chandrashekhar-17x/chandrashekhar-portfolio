import { InjectionToken } from '@angular/core';

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
    url: 'https://chandrashekhar.dev',
    name: 'Chandrashekhar',
    description:
      'Frontend engineer who builds complex UIs (CAD editors, PDF engines, data grids), now building the AI systems behind them.',
    ogImage: '/og/default.jpg',
  }),
});
