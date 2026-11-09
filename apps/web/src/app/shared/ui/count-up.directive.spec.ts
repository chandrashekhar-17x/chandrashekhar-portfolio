import { parseStat } from './count-up.directive';

describe('parseStat', () => {
  it('splits numbers from their prefix/suffix', () => {
    expect(parseStat('30+')).toEqual({ prefix: '', n: 30, suffix: '+' });
    expect(parseStat('4+ yrs')).toEqual({ prefix: '', n: 4, suffix: '+ yrs' });
    expect(parseStat('~12')).toEqual({ prefix: '~', n: 12, suffix: '' });
  });

  it('returns null when there is no number', () => {
    expect(parseStat('many')).toBeNull();
  });
});
