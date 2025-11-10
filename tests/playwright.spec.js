const { test, expect } = require('@playwright/test');
const path = require('path');

test('fun button shows joke overlay', async ({ page }) => {
  const file = 'file://' + path.resolve(__dirname, '..', 'src', 'index.html');
  await page.goto(file);
  // ゲーム開始フォームを非表示にして直接表示する手順（フォームを使う場合は要調整）
  await page.evaluate(() => {
    const setup = document.getElementById('setup-container');
    const board = document.getElementById('board');
    const playerInfo = document.getElementById('player-info');
    const roll = document.getElementById('roll-button');
    if (setup) setup.style.display = 'none';
    if (board) board.style.display = 'block';
    if (playerInfo) playerInfo.style.display = 'block';
    if (roll) roll.style.display = 'block';
  });

  const fun = await page.locator('#fun-button');
  await expect(fun).toBeVisible();
  await fun.click();
  // オーバーレイが出るのを待つ
  const overlay = page.locator('.joke-overlay');
  await expect(overlay).toBeVisible({ timeout: 3000 });
});
