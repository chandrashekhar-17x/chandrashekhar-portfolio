import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE_CONFIG } from './site-config';

export interface PageSeo {
  title: string;
  description?: string;
  /** Path of the page, e.g. "/work/cad-editor" (used for canonical + og:url). */
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}

/**
 * Sets everything search engines and link previews read: <title>, description,
 * canonical URL, Open Graph and Twitter tags, plus JSON-LD structured data.
 * Runs during SSR too, so the tags are in the HTML that crawlers download.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly site = inject(SITE_CONFIG);

  update(page: PageSeo): void {
    const description = page.description ?? this.site.description;
    const url = this.site.url + (page.path === '/' ? '' : page.path);
    const image = this.site.url + (page.image ?? this.site.ogImage);

    this.title.setTitle(page.title);
    const tags: Record<string, string> = {
      description,
      'og:title': page.title,
      'og:description': description,
      'og:url': url,
      'og:image': image,
      'og:type': page.type ?? 'website',
      'og:site_name': this.site.name,
      'twitter:card': 'summary_large_image',
      'twitter:title': page.title,
      'twitter:description': description,
      'twitter:image': image,
    };
    for (const [key, content] of Object.entries(tags)) {
      const attr = key.startsWith('og:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }
    this.link('canonical', url);
  }

  /** Adds or replaces a JSON-LD <script> (structured data) identified by `id`. */
  jsonLd(id: string, data: object): void {
    let script = this.doc.head.querySelector<HTMLScriptElement>(`script#${id}`);
    if (!script) {
      script = this.doc.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    // Escape "<" so content can never close the script tag early (XSS safety).
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  removeJsonLd(id: string): void {
    this.doc.head.querySelector(`script#${id}`)?.remove();
  }

  private link(rel: string, href: string): void {
    let el = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = this.doc.createElement('link');
      el.rel = rel;
      this.doc.head.appendChild(el);
    }
    el.href = href;
  }
}
