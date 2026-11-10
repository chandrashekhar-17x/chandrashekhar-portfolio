import { render, screen } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  it('lists roles newest first with org names, durations and case-study links', async () => {
    const experience = await firstValueFrom(new MockContentRepository().experience());
    await render(ExperienceTimeline, { inputs: { experience } });

    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent.trim());
    expect(titles[0]).toContain('Software Engineer · VassarDigital.ai');
    expect(titles.at(-1)).toContain('Vassar Labs');
    expect(screen.queryByText('sample')).toBeNull();
    expect(screen.getByText('Aug 2023 – Dec 2023 · 5 mos')).toBeTruthy();
    expect(screen.getByText('Internship · Hyderabad, Telangana, India')).toBeTruthy();
    const link = screen.getAllByRole('link', { name: 'case study →' })[0];
    expect(link?.getAttribute('href')).toBe('/work/custom-cad-editor');
  });
});
