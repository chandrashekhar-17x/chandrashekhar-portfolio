import { render } from '@testing-library/angular';

import { HeroTitle, alignGradient, graphemes } from './hero-title';

describe('HeroTitle', () => {
  it('groups letters by word so words cannot split, with staggered delays', async () => {
    const { container } = await render(HeroTitle, {
      inputs: { name: 'Ada', text: 'Frontend engineer', highlight: '→ AI engineer.' },
    });
    const words = [...container.querySelectorAll('.word')].map((w) =>
      w.textContent.replace(/\s/g, ''),
    );
    expect(words).toEqual(['Frontend', 'engineer', '→', 'AI', 'engineer.']);

    const delays = [...container.querySelectorAll<HTMLElement>('.ch')].map(
      (c) => c.style.animationDelay,
    );
    expect(delays.slice(0, 3)).toEqual(['0ms', '28ms', '56ms']);
    expect(container.querySelector('.grad')?.textContent.replace(/\s/g, '')).toBe('→AIengineer.');
  });
});

describe('alignGradient', () => {
  it('writes each letter offset and the line width as CSS variables', async () => {
    const { container } = await render(HeroTitle, {
      inputs: { name: 'Ada', text: 'Hi', highlight: 'AI' },
    });
    const line = container.querySelector<HTMLElement>('.grad');
    const letters = [...container.querySelectorAll<HTMLElement>('.grad .ch')];
    if (!line) throw new Error('no gradient line');
    // jsdom has no layout: fake the measurements.
    Object.defineProperty(line, 'offsetWidth', { value: 120 });
    letters.forEach((l, i) => Object.defineProperty(l, 'offsetLeft', { value: i * 40 }));

    alignGradient(container);

    expect(line.style.getPropertyValue('--w')).toBe('120px');
    expect(letters.map((l) => l.style.getPropertyValue('--x'))).toEqual(['0px', '40px']);
  });
});

describe('graphemes', () => {
  it('keeps combined characters together and loses nothing', () => {
    const hindi = 'नमस्ते'; // letters with vowel signs / virama
    const parts = graphemes(hindi);
    expect(parts.join('')).toBe(hindi);
    expect(parts.length).toBeLessThan(Array.from(hindi).length); // code points split them
    expect(graphemes('AI')).toEqual(['A', 'I']);
  });
});
