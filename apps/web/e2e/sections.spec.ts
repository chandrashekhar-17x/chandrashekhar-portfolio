import { expect, test } from '@playwright/test';

test('all five home sections reveal, one at a time and in page order', async ({ page }) => {
  await page.goto('/');
  // Record when each section's real content appears while we scroll down.
  await page.evaluate(() => {
    const w = window as Window & { __revealed?: Record<string, number> };
    w.__revealed = {};
    const ids = ['graph', 'work', 'lab', 'xp', 'contact'];
    const tick = () => {
      for (const id of ids) {
        if (!w.__revealed?.[id] && document.querySelector(`#${id} .is-revealed`)) {
          (w.__revealed ??= {})[id] = performance.now();
        }
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
  for (const id of ['graph', 'work', 'lab', 'xp', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id} .is-revealed`)).toBeVisible({ timeout: 8000 });
  }
  const times = await page.evaluate(
    () => (window as Window & { __revealed?: Record<string, number> }).__revealed ?? {},
  );
  const order = Object.entries(times)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
  expect(order).toEqual(['graph', 'work', 'lab', 'xp', 'contact']);
});

test('contact form validates and confirms without sending', async ({ page }) => {
  await page.goto('/#contact');
  const form = page.locator('app-contact-form');
  await expect(form).toBeVisible({ timeout: 8000 });
  await form.getByRole('button', { name: /Send message/ }).click();
  await expect(form.getByText('This field is required.').first()).toBeVisible();

  await form.getByRole('textbox', { name: /name/ }).fill('Ada');
  await form.getByRole('textbox', { name: /email/ }).fill('ada@example.com');
  await form.getByRole('textbox', { name: /message/ }).fill('Hello there, nice portfolio!');
  await form.getByRole('button', { name: /Send message/ }).click();
  await expect(form.getByRole('status')).toContainText('Nothing was sent yet');
});

test('AI lab mic demo pulses, then asks the chat', async ({ page }) => {
  await page.goto('/lab');
  // Locate by class: the button's accessible name changes once it is pressed.
  const mic = page.locator('app-lab-hud button.mic');
  await expect(mic).toContainText('Tap to speak');
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  // After the "listening" demo it asks the chat a question (prototype behaviour).
  await expect(mic).toContainText('answering in the chat', { timeout: 4000 });
  await expect(page.getByRole('dialog', { name: 'Talk to My Agent.' })).toBeVisible();
});

test('/resume is server-rendered with experience, skills and projects', async ({ page }) => {
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto('/resume');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chandrashekhar');
  for (const h of ['Experience', 'Skills', 'Selected projects']) {
    await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Canvas CAD Editor' })).toBeVisible();
});
