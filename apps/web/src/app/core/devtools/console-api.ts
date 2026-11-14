/**
 * A tiny API for people who open DevTools (the engineers I most want to meet).
 * `window.chandrashekhar.help()` lists it. Every method returns a string, so the
 * console prints a friendly answer instead of `undefined`.
 */

export interface ConsoleActions {
  ask(question: string): void;
  blueprint(): boolean;
  theme(): string;
  hire(): void;
}

export const REPO_URL = 'https://github.com/chandrashekhar-17x/chandrashekhar-portfolio';

const HELP = `chandrashekhar.ask("question")  ask my agent (watch the graph light up)
chandrashekhar.blueprint()       view this page as a CAD drawing
chandrashekhar.theme()           toggle dark / light
chandrashekhar.stack()           what this site is built with
chandrashekhar.source()          the repo (it's public)
chandrashekhar.hire()            the shortest path to my inbox`;

const STACK = `Angular 22 · zoneless · signals · SSR + @defer per section
Canvas 2D: hero starfield, force-directed knowledge graph (no d3)
FastAPI · Postgres + pgvector · Redis · RAG agent (in progress)
Lighthouse 100 ×4 · axe 0 serious · 150+ e2e · screenshot tests`;

export function consoleApi(actions: ConsoleActions): Record<string, (...args: string[]) => string> {
  return {
    help: () => HELP,
    stack: () => STACK,
    source: () => REPO_URL,
    ask: (question = '') => {
      if (!question.trim()) return 'Try: chandrashekhar.ask("What did you build with Three.js?")';
      actions.ask(question);
      return 'Asked. The answer is streaming into the chat →';
    },
    blueprint: () =>
      actions.blueprint() ? 'Blueprint mode on. Esc to exit.' : 'Blueprint mode off.',
    theme: () => `Theme: ${actions.theme()}`,
    hire: () => {
      actions.hire();
      return 'Scrolling to the contact form. Say hi 👋';
    },
  };
}

/** Styled greeting + `window.chandrashekhar`. Browser only; call once. */
export function installConsoleApi(actions: ConsoleActions): void {
  const w = window as unknown as Record<string, unknown>;
  if (w['chandrashekhar']) return;
  w['chandrashekhar'] = consoleApi(actions);
  console.log(
    '%cHi, fellow dev 👋%c\nYou opened DevTools, so you are my kind of person.\nType %cchandrashekhar.help()%c to see what this site can do from here.',
    'font: 600 16px system-ui; color: #8b5cf6',
    'font: 13px system-ui',
    'font: 13px ui-monospace, monospace; color: #22d3ee',
    'font: 13px system-ui',
  );
}
