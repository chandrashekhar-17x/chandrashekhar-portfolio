import { render, screen } from '@testing-library/angular';

import { SectionSkeleton } from './section-skeleton';

describe('SectionSkeleton', () => {
  it('is announced as a busy status with a readable label', async () => {
    await render(SectionSkeleton, { inputs: { kind: 'work', label: 'selected work' } });
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-label')).toBe('Loading selected work');
    expect(status.getAttribute('aria-busy')).toBe('true');
  });

  it('renders one card placeholder per item and shimmers while loading', async () => {
    const { container } = await render(SectionSkeleton, {
      inputs: { kind: 'work', label: 'work', count: 4, loading: true },
    });
    expect(container.querySelectorAll('.card')).toHaveLength(4);
    expect(screen.getByRole('status').classList).toContain('is-loading');
  });
});
