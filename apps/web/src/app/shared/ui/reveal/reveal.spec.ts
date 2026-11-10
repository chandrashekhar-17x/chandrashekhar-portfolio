import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import { MediaPrefs } from '../../../core/motion/media-prefs.service';
import { Reveal } from './reveal';

@Component({
  imports: [Reveal],
  template: `<app-reveal kind="work" label="work"
    ><ng-template><p>real content</p></ng-template></app-reveal
  >`,
})
class Host {}

describe('Reveal', () => {
  it('shows the skeleton first, then the content when its turn comes', async () => {
    await render(Host, {
      providers: [{ provide: MediaPrefs, useValue: { reducedMotion: signal(true) } }],
    });
    expect(await screen.findByText('real content')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
