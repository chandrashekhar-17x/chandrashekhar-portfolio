import { render, screen } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  it('lists roles newest first with org names, periods and sample badges', async () => {
    const experience = await firstValueFrom(new MockContentRepository().experience());
    await render(ExperienceTimeline, { inputs: { experience } });

    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent.trim());
    expect(titles[0]).toContain('AI engineering track · Self-directed');
    expect(titles.at(-1)).toContain('Company B');
    expect(screen.getAllByText('sample').length).toBe(2);
    expect(screen.getByText('2021 — 2022')).toBeTruthy();
  });
});
