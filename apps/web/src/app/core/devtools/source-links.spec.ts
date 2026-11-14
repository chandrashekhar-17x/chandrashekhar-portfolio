import { sourceUrl } from './source-links';

const REPO = 'https://github.com/chandrashekhar-17x/chandrashekhar-portfolio';

describe('sourceUrl', () => {
  it('links home sections to their feature folder at the build commit', () => {
    expect(sourceUrl('xp', '/', 'abc123')).toBe(
      `${REPO}/tree/abc123/apps/web/src/app/features/experience`,
    );
  });

  it('links other pages by route, and falls back to main without a commit', () => {
    expect(sourceUrl('main', '/work/progressive-pdf-viewer', null)).toBe(
      `${REPO}/tree/main/apps/web/src/app/features/work/case-study`,
    );
    expect(sourceUrl('main', '/nope', null)).toBeNull();
  });
});
