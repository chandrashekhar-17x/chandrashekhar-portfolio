import { scrambleFrame } from './scramble.directive';

describe('scrambleFrame', () => {
  const zero = () => 0; // always picks the first glyph: "!"

  it('reveals the text progressively, two frames per character', () => {
    expect(scrambleFrame('abc', 0, zero)).toBe('!!!');
    expect(scrambleFrame('abc', 2, zero)).toBe('a!!');
    expect(scrambleFrame('abc', 6, zero)).toBe('abc');
  });

  it('keeps spaces so word shapes stay readable', () => {
    expect(scrambleFrame('a b', 0, zero)).toBe('! !');
  });
});
