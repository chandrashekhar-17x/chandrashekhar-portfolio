import { expect, test } from '@playwright/test';

test.describe('chat', () => {
  test('orb opens the chat; a suggestion streams a cited answer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Talk to my AI agent' }).last().click();
    const panel = page.getByRole('dialog', { name: 'Talk to My Agent.' });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('textbox')).toBeFocused();

    await panel.getByRole('button', { name: "What's his biggest project?" }).click();
    const answer = panel.locator('.msg.agent').last();
    await expect(answer).toContainText('CAD viewer/editor', { timeout: 5000 });
    await expect(
      answer.getByRole('button', { name: 'Custom CAD Viewer & Editor, built from zero' }),
    ).toBeVisible();
  });

  test('says it does not know instead of guessing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Talk to my AI agent' }).last().click();
    const panel = page.getByRole('dialog', { name: 'Talk to My Agent.' });
    await panel.getByRole('textbox').fill('Does he know Rust?');
    await panel.getByRole('button', { name: 'Send' }).click();
    await expect(panel.locator('.msg.agent').last()).toContainText("isn't in his profile", {
      timeout: 5000,
    });
  });

  test('hero button opens the chat and Esc closes it, returning focus to the orb', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .locator('app-hero-section')
      .getByRole('button', { name: /Talk to my AI agent/ })
      .click();
    const panel = page.getByRole('dialog', { name: 'Talk to My Agent.' });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.locator('app-chat-widget .fab')).toBeFocused();
  });

  test('cited answers light up the knowledge graph', async ({ page }) => {
    await page.goto('/');
    await page.locator('#graph').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'View as list' }).click(); // lit nodes are visible as text
    await page.getByRole('button', { name: 'Talk to my AI agent' }).last().click();
    const panel = page.getByRole('dialog', { name: 'Talk to My Agent.' });
    await panel.getByRole('button', { name: 'What are his key skills?' }).click();
    await expect(page.locator('app-graph-list li.lit').first()).toBeVisible({ timeout: 5000 });
  });
});
