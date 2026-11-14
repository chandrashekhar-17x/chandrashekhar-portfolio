import { expect, test } from '@playwright/test';

test('the career time machine replays the graph from 2020 to today', async ({ page }) => {
  await page.goto('/graph');
  const machine = page.getByRole('group', { name: 'Career time machine' });
  const slider = machine.getByRole('slider', { name: 'Career time machine' });
  await expect(machine).toContainText('Today');
  await expect(machine).toContainText('73/73 nodes');

  // Aug 2023 = 43 months after Jan 2020.
  await slider.fill('43');
  await expect(machine).toContainText('Aug 2023');
  await expect(machine).toContainText('Software Engineer at Vassar Labs');
  const shown = Number((await machine.locator('.count').innerText()).split('/')[0]);
  expect(shown).toBeLessThan(73);

  // Play runs to the end and lands on today with everything visible.
  await machine.getByRole('button', { name: /play my career/i }).click();
  await expect(machine).toContainText('Today', { timeout: 15_000 });
  await expect(machine).toContainText('73/73 nodes');
});
