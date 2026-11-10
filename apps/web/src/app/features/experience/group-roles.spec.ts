import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { groupRoles } from './group-roles';

describe('groupRoles', () => {
  it('groups 3 roles under 2 companies, newest first, with company totals', async () => {
    const xp = await firstValueFrom(new MockContentRepository().experience());
    const groups = groupRoles(xp, new Date(2026, 10, 10));
    expect(groups.map((g) => g.org.name)).toEqual(['VassarDigital.ai', 'Vassar Labs']);
    expect(groups.map((g) => g.roles.length)).toEqual([1, 2]);
    expect(groups[0]?.current).toBe(true);
    expect(groups[0]?.total).toBe('2 yrs 11 mos');
    expect(groups[1]?.total).toBe('1 yr'); // Jan – Dec 2023
    expect(groups[1]?.roles.map((r) => r.employmentType)).toEqual(['full-time', 'internship']);
  });
});
