import { expect, test } from '@playwright/test';

// Regression (Phase 1): the home <h1> once broke "Chandrashekhar" mid-word.
// The hero title now animates letter by letter; this guards that no word ever
// splits across lines, overflows the screen, or causes sideways scrolling.
const WIDTHS = [320, 390, 1440] as const;

interface WordBox {
  text: string;
  left: number;
  right: number;
  lines: number;
}

for (const width of WIDTHS) {
  test(`hero heading words never break at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' }); // letters in final position
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveAccessibleName(/Chandrashekhar/);

    const words = await h1.locator('.word').evaluateAll((els): WordBox[] =>
      els.map((el) => {
        // Distinct line tops of the word's letters: 1 means the word is on one line.
        const tops = new Set(
          [...el.children].map((c) => Math.round(c.getBoundingClientRect().top)),
        );
        const box = el.getBoundingClientRect();
        return { text: el.textContent.trim(), left: box.left, right: box.right, lines: tops.size };
      }),
    );
    expect(words.length).toBeGreaterThan(0);
    for (const w of words) {
      expect(w.lines, `"${w.text}" split across lines`).toBe(1);
      expect(w.left, `"${w.text}" starts off-screen`).toBeGreaterThanOrEqual(0);
      expect(w.right, `"${w.text}" overflows the screen`).toBeLessThanOrEqual(width);
    }

    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(sideways, 'page scrolls horizontally').toBe(false);
  });
}
