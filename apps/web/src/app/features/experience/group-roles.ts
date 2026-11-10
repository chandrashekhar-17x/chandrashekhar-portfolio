import { Experience, Organization, Role } from '../../core/content/content.types.gen';
import { formatDuration, monthsBetween } from '../../core/time/duration';
import { byRecency } from './format-period';

export interface OrgGroup {
  org: Organization;
  roles: Role[]; // newest first
  current: boolean;
  /** Whole time at the company, e.g. "1 yr" (LinkedIn's company total). */
  total: string;
}

/**
 * Groups roles by company, LinkedIn style: companies newest first, each with its
 * roles newest first and the total time spent there.
 */
export function groupRoles(xp: Experience, today = new Date()): OrgGroup[] {
  const groups = new Map<string, OrgGroup>();
  for (const role of [...xp.roles].sort(byRecency)) {
    const org = xp.organizations.find((o) => o.id === role.org) ?? {
      id: role.org,
      name: role.org,
      kind: 'company' as const,
    };
    const group = groups.get(org.id) ?? { org, roles: [], current: false, total: '' };
    group.roles.push(role);
    group.current ||= !role.end;
    groups.set(org.id, group);
  }
  for (const g of groups.values()) {
    const start = g.roles.map((r) => r.start).sort()[0] ?? '';
    const end = g.current
      ? undefined
      : g.roles
          .map((r) => r.end ?? '')
          .sort()
          .at(-1);
    g.total = formatDuration(monthsBetween(start, end, today));
  }
  return [...groups.values()];
}
