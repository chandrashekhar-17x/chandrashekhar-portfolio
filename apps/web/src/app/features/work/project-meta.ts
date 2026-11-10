import { Project } from '../../core/content/content.types.gen';

// Small display helpers shared by the project card and the case-study page.

const STATUS_LABEL: Record<NonNullable<Project['status']>, string> = {
  shipped: 'Shipped',
  'in-progress': 'In progress',
  planned: 'Planned',
};

/**
 * Honest label for where the work comes from. Personal work shows its status,
 * so a planned demo is never presented as if it already existed.
 */
export function projectKind(p: Pick<Project, 'type' | 'status'>): string {
  if (p.type === 'professional') return 'Professional · details anonymised';
  return p.status && p.status !== 'shipped'
    ? `Personal · ${STATUS_LABEL[p.status].toLowerCase()}`
    : 'Personal · open source';
}

/** "Professional · details anonymised · 2025–2026" or "Personal · in progress". */
export function projectEyebrow(p: Pick<Project, 'type' | 'period' | 'status'>): string {
  return [projectKind(p), p.period].filter(Boolean).join(' · ');
}
