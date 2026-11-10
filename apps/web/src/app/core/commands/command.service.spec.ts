import { TestBed } from '@angular/core/testing';

import { Command, CommandService, filterCommands } from './command.service';

const cmd = (id: string, label: string, keywords?: string): Command => ({
  id,
  label,
  group: 'Actions',
  ...(keywords ? { keywords } : {}),
  run: () => undefined,
});

describe('filterCommands', () => {
  const all = [
    cmd('a', 'Go to Work'),
    cmd('b', 'Toggle theme', 'dark light'),
    cmd('c', 'Work list'),
  ];

  it('returns everything for an empty query', () => {
    expect(filterCommands(all, '  ')).toHaveLength(3);
  });

  it('matches every word against label, group and keywords', () => {
    expect(filterCommands(all, 'dark').map((c) => c.id)).toEqual(['b']);
    expect(filterCommands(all, 'go work').map((c) => c.id)).toEqual(['a']);
  });

  it('ranks labels that start with the query first', () => {
    expect(filterCommands(all, 'work').map((c) => c.id)).toEqual(['c', 'a']);
  });
});

describe('CommandService', () => {
  it('registers, replaces by id and unregisters', () => {
    const service = TestBed.inject(CommandService);
    const off = service.register([cmd('x', 'One')]);
    service.register([cmd('x', 'One again')]);
    expect(service.commands().map((c) => c.label)).toEqual(['One again']);
    off();
    expect(service.commands()).toHaveLength(0);
  });
});
