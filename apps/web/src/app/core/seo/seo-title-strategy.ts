import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SeoService } from './seo.service';

/**
 * Angular calls this after every navigation (server and browser). Besides the
 * <title>, it applies the route's `data.description` and the canonical URL, so
 * every page gets complete meta tags from the route table alone.
 * Pages with dynamic content (case studies) refine it via SeoService afterwards.
 */
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route: ActivatedRouteSnapshot = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const description = route.data['description'] as string | undefined;
    this.seo.update({
      title: this.buildTitle(snapshot) ?? 'Chandrashekhar',
      ...(description ? { description } : {}),
      path: snapshot.url.split(/[?#]/)[0] ?? '/',
    });
  }
}
