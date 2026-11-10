export function siteOrigin(value) {
  const url = new URL(value?.trim() || 'https://chandrashekhar.dev');
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
