import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { CommandService } from '../../core/commands/command.service';
import { ThemeService } from '../../core/theme/theme.service';
import { provideChat } from '../../features/chat/provide-chat';
import { CommandPalette } from './command-palette';

describe('CommandPalette', () => {
  const setup = async () => {
    const view = await render(CommandPalette, { providers: [provideRouter([]), provideChat()] });
    const service = view.fixture.debugElement.injector.get(CommandService);
    service.open();
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    return { ...view, service };
  };

  it('filters as you type and runs the highlighted command with Enter', async () => {
    const { service, fixture } = await setup();
    const theme = fixture.debugElement.injector.get(ThemeService);
    const input = screen.getByRole('combobox', { hidden: true });

    await userEvent.type(input, 'theme');
    expect(screen.getAllByRole('option', { hidden: true }).map((o) => o.textContent)).toEqual([
      expect.stringContaining('Toggle dark / light theme'),
    ]);
    await userEvent.keyboard('{Enter}');
    expect(theme.theme()).toBe('light');
    expect(service.isOpen()).toBe(false);
  });

  it('moves the highlight with arrow keys and wraps around', async () => {
    await setup();
    const input = screen.getByRole('combobox', { hidden: true });
    const options = () => screen.getAllByRole('option', { hidden: true });

    expect(options()[0]?.getAttribute('aria-selected')).toBe('true');
    await userEvent.type(input, '{ArrowUp}');
    expect(options().at(-1)?.getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options().at(-1)?.id);
  });
});
