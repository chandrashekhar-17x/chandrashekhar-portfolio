export function siteOrigin(value) {
  // Fallback when PUBLIC_SITE_URL is unset: the live site on Cloudflare Pages
  // (chandrashekhar.dev belongs to someone else).
  const url = new URL(value?.trim() || 'https://chandrashekhar.pages.dev');
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, path or query.',
    );
  }
  return url.origin;
}

/** Content API origin, or null when unset (the site then uses the bundled content/). */
export function apiOrigin(value) {
  const v = value?.trim();
  if (!v) return null;
  try {
    return siteOrigin(v);
  } catch {
    throw new Error('PUBLIC_API_URL must be an HTTP(S) origin without credentials, path or query.');
  }
}
