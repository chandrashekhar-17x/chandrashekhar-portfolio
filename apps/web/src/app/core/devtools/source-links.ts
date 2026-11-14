import { BUILD_INFO } from '../seo/site-origin.gen';
import { REPO_URL } from './console-api';

/** Feature folder (under apps/web/src/app/) behind each home section. */
const SECTION_FOLDER: Record<string, string> = {
  hero: 'features/hero',
  about: 'features/about',
  featured: 'features/featured',
  graph: 'features/graph',
  work: 'features/work',
  lab: 'features/lab',
  xp: 'features/experience',
  contact: 'features/contact',
};

/** Other pages: route → folder (first match wins). */
const PAGE_FOLDER: readonly [RegExp, string][] = [
  [/^\/work\/[^/?#]+/, 'features/work/case-study'],
  [/^\/work/, 'features/work'],
  [/^\/graph/, 'features/graph'],
  [/^\/lab/, 'features/lab'],
  [/^\/resume/, 'features/resume'],
  [/^\/journal/, 'features/journal'],
];

/**
 * GitHub link to the code behind a blueprint section, pinned to the commit this
 * build came from (so the link shows exactly the code that is running).
 */
export function sourceUrl(
  sectionId: string,
  route: string,
  sha: string | null = BUILD_INFO?.sha ?? null,
): string | null {
  const folder =
    SECTION_FOLDER[sectionId] ?? PAGE_FOLDER.find(([pattern]) => pattern.test(route))?.[1];
  if (!folder) return null;
  return `${REPO_URL}/tree/${sha ?? 'main'}/apps/web/src/app/${folder}`;
}
