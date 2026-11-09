/** Home sections linked from the nav (fragment = section id on the home page). */
export interface NavLink {
  label: string;
  fragment: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Knowledge graph', fragment: 'graph' },
  { label: 'Work', fragment: 'work' },
  { label: 'AI Lab', fragment: 'lab' },
  { label: 'Experience', fragment: 'xp' },
  { label: 'Contact', fragment: 'contact' },
];
