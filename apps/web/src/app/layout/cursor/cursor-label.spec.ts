import { cursorLabelFor } from './cursor-label';

function el(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  const target = host.querySelector('[data-target]');
  if (!target) throw new Error('no target');
  return target;
}

describe('cursorLabelFor', () => {
  it('uses an explicit data-cursor label from the element or an ancestor', () => {
    expect(
      cursorLabelFor(el('<article data-cursor="open"><h3 data-target>x</h3></article>')).label,
    ).toBe('open');
  });

  it('says "click" for links and buttons', () => {
    expect(cursorLabelFor(el('<button><span data-target>Go</span></button>')).label).toBe('click');
    expect(cursorLabelFor(el('<a href="/"><b data-target>x</b></a>')).label).toBe('click');
  });

  it('hides the custom cursor over text fields (the caret is more useful)', () => {
    expect(cursorLabelFor(el('<input data-target />')).hidden).toBe(true);
    expect(cursorLabelFor(el('<textarea data-target></textarea>')).hidden).toBe(true);
  });

  it('shows no label on plain content', () => {
    expect(cursorLabelFor(el('<p data-target>text</p>'))).toEqual({ label: '', hidden: false });
    expect(cursorLabelFor(null)).toEqual({ label: '', hidden: false });
  });
});
