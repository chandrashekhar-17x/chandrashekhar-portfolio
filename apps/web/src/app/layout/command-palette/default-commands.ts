import { Router } from '@angular/router';

import { ChatStore } from '../../core/chat/chat-store.service';
import { Command } from '../../core/commands/command.service';
import { ThemeService } from '../../core/theme/theme.service';

/** Built-in commands: home sections, pages and global actions. */
export function defaultCommands(router: Router, theme: ThemeService, chat: ChatStore): Command[] {
  const section = (id: string, label: string): Command => ({
    id: `section:${id}`,
    label: `Go to ${label}`,
    group: 'Sections',
    run: () => void router.navigate(['/'], { fragment: id }),
  });
  const page = (path: string, label: string, keywords?: string): Command => ({
    id: `page:${path}`,
    label,
    group: 'Pages',
    ...(keywords ? { keywords } : {}),
    run: () => void router.navigateByUrl(path),
  });

  return [
    section('graph', 'Knowledge graph'),
    section('work', 'Work'),
    section('lab', 'AI Lab'),
    section('xp', 'Experience'),
    section('contact', 'Contact'),
    page('/', 'Home page'),
    page('/work', 'All projects', 'work case studies'),
    page('/graph', 'Full-screen knowledge graph'),
    page('/lab', 'AI Lab page', 'agents voice jarvis'),
    page('/resume', 'Resume', 'cv pdf print'),
    page('/journal', 'Journal', 'blog learning'),
    {
      id: 'action:chat',
      label: 'Ask my agent',
      group: 'Actions',
      keywords: 'chat ai question',
      run: () => {
        chat.open();
      },
    },
    {
      id: 'action:theme',
      label: 'Toggle dark / light theme',
      group: 'Actions',
      keywords: 'mode colour color',
      run: () => {
        theme.toggle();
      },
    },
  ];
}
