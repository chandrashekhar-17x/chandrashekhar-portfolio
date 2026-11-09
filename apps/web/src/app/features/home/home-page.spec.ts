import { TestBed } from '@angular/core/testing';

import { HomePage } from './home-page';

describe('HomePage', () => {
  it('shows one h1 with the owner name', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const headings = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toContain('Chandrashekhar');
  });
});
