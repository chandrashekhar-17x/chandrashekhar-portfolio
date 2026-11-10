import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  it('groups roles by company (LinkedIn style) with durations and case-study links', async () => {
    const experience = await firstValueFrom(new MockContentRepository().experience());
    await render(ExperienceTimeline, { inputs: { experience }, providers: [provideRouter([])] });

    const companies = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent.trim());
    expect(companies).toEqual(['VassarDigital.ai', 'Vassar Labs']);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3);
    expect(screen.getByText('Present')).toBeTruthy();
    expect(screen.getByText('Aug 2023 – Dec 2023 · 5 mos')).toBeTruthy();
    expect(screen.getByText('Internship')).toBeTruthy();
    expect(screen.queryByText('sample')).toBeNull();
    const link = screen.getAllByRole('link', { name: 'case study →' })[0];
    expect(link?.getAttribute('href')).toBe('/work/custom-cad-editor');
  });
});
