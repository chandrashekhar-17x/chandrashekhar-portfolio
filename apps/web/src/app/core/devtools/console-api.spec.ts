import { consoleApi } from './console-api';

describe('consoleApi', () => {
  const make = () => {
    const calls: string[] = [];
    const api = consoleApi({
      ask: (q) => calls.push(`ask:${q}`),
      blueprint: () => true,
      theme: () => 'light',
      hire: () => calls.push('hire'),
    });
    return { api, calls };
  };

  it('lists every method in help()', () => {
    const { api } = make();
    for (const name of Object.keys(api).filter((n) => n !== 'help')) {
      expect(api['help']?.()).toContain(`chandrashekhar.${name}(`);
    }
  });

  it('forwards questions to the agent, but not empty ones', () => {
    const { api, calls } = make();
    expect(api['ask']?.('  ')).toContain('Try:');
    api['ask']?.('What is RAG?');
    expect(calls).toEqual(['ask:What is RAG?']);
  });

  it('answers with text for the console', () => {
    const { api, calls } = make();
    expect(api['blueprint']?.()).toContain('on');
    expect(api['theme']?.()).toBe('Theme: light');
    api['hire']?.();
    expect(calls).toEqual(['hire']);
  });
});
