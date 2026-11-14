import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import {
  CareerData,
  NOW,
  futureAt,
  milestoneAt,
  milestones,
  monthsBetween,
  nodeStarts,
  toMonth,
} from './time-machine';

async function real() {
  const repo = new MockContentRepository();
  const data: CareerData = {
    projects: await firstValueFrom(repo.projects()),
    experience: await firstValueFrom(repo.experience()),
    education: await firstValueFrom(repo.education()),
  };
  return { data, graph: await firstValueFrom(repo.graph()) };
}

describe('time machine', () => {
  it('counts months and normalises years', () => {
    expect(toMonth('2024')).toBe('2024-01');
    expect(monthsBetween('2023-11', '2024-02')).toEqual([
      '2023-11',
      '2023-12',
      '2024-01',
      '2024-02',
    ]);
  });

  it('dates projects, employers and the degree from content', async () => {
    const { data, graph } = await real();
    const starts = nodeStarts(graph, data);
    expect(starts.get('project:progressive-pdf-viewer')).toBe('2025-07');
    expect(starts.get('project:custom-cad-editor')).toBe('2026-04');
    expect(starts.get('org:vassar-labs')).toBe('2023-01');
    expect(starts.get('edu:nit-jamshedpur')).toBe('2020-01');
    expect(starts.get('project:jarvis-voice')).toBeNull(); // planned
  });

  it('a skill appears with the first dated thing that uses it', async () => {
    const { data, graph } = await real();
    const starts = nodeStarts(graph, data);
    expect(starts.get('skill:pdfjs')).toBe('2024-01'); // first used at VassarDigital
    expect((starts.get('skill:threejs') ?? '9999-12') <= '2026-04').toBe(true);
  });

  it('hides what did not exist yet, and nothing at "now"', async () => {
    const { data, graph } = await real();
    const starts = nodeStarts(graph, data);
    const before = futureAt(starts, '2022-06');
    expect(before.has('org:vassardigital')).toBe(true);
    expect(before.has('edu:nit-jamshedpur')).toBe(false);
    expect(before.has('hub:frontend')).toBe(false); // hubs are always shown
    expect(futureAt(starts, NOW).size).toBe(0);
  });

  it('tells the story at each point in time', async () => {
    const { data } = await real();
    const all = milestones(data);
    expect(milestoneAt(all, '2020-03')?.text).toBe(
      'Starts Master of Computer Applications at NIT Jamshedpur',
    );
    expect(milestoneAt(all, '2023-08')?.text).toBe('Software Engineer at Vassar Labs');
    expect(milestoneAt(all, '2025-07')?.text).toBe('Progressive PDF Viewer');
    expect(milestoneAt(all, NOW)).toBeNull();
  });
});
