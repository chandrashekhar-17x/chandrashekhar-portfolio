import { Component } from '@angular/core';
import { render } from '@testing-library/angular';

import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { Tilt } from './tilt.directive';

@Component({
  imports: [Tilt],
  template: `<div appTilt style="width: 200px; height: 100px"></div>`,
})
class Host {}

function move(el: HTMLElement): void {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 0 }));
}

describe('Tilt', () => {
  it('tilts towards the pointer and moves the glare when rich motion is on', async () => {
    const { container } = await render(Host, {
      providers: [{ provide: MediaPrefs, useValue: { richMotion: true } }],
    });
    const el = container.querySelector<HTMLElement>('[appTilt]');
    if (!el) throw new Error('missing');
    move(el);
    expect(el.style.transform).toBe('rotateY(7.00deg) rotateX(7.00deg)');
    expect(el.style.getPropertyValue('--gx')).toBe('100.0%');
    el.dispatchEvent(new PointerEvent('pointerleave'));
    expect(el.style.transform).toBe('');
  });

  it('does nothing on touch screens / reduced motion', async () => {
    const { container } = await render(Host, {
      providers: [{ provide: MediaPrefs, useValue: { richMotion: false } }],
    });
    const el = container.querySelector<HTMLElement>('[appTilt]');
    if (!el) throw new Error('missing');
    move(el);
    expect(el.style.transform).toBe('');
  });
});
