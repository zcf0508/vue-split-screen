import { expect, test } from '@playwright/test';

test('split screen navigation', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Turn on split screen mode
  await page.getByRole('button', { name: 'turn on' }).click();

  // --- Test left push ---
  // 1. Click "Go somewhere" on the left screen
  await page.getByRole('button', { name: 'Go somewhere.' }).click();
  await page.waitForURL(/\/some\//);

  // Left screen should still be HelloWorld, right screen should be the "some" page
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toBeVisible();

  // --- Test right push ---
  // 2. Click "Go somewhere" on the right screen
  await page.locator('div', { hasText: /This is a test page. The id is/ }).getByRole('button', { name: 'Go somewhere.' }).nth(1).click();
  await page.waitForURL(/\/some\//);

  // The previous right screen should now be on the left, and a new "some" page on the right
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(2);

  // --- Test left replace ---
  // 3. Click "replace somewhere" on the left screen
  await page.locator('div', { hasText: /This is a test page. The id is/ }).first().getByRole('button', { name: 'replace somewhere.' }).first().click();
  await page.waitForURL(/\/some\//);

  // The left screen should be replaced with a new some page, and the right screen should be the placeholder
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);
  await expect(page.getByText('This is a SplitScreen placeholder.')).toBeVisible();
});

test('left push 3 times, back once, right replace scenario', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Turn on split screen mode
  await page.getByRole('button', { name: 'turn on' }).click();

  // 左侧第1次push: 点击左侧"Go somewhere"
  await page.getByRole('button', { name: 'Go somewhere.' }).click();
  await page.waitForURL(/\/some\//);
  
  // 验证：左侧是HelloWorld，右侧是some页面
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);

  // 左侧第2次push: 再次点击左侧"Go somewhere"
  await page.getByRole('button', { name: 'Go somewhere.' }).first().click();
  await page.waitForURL(/\/some\//);
  
  // 验证：左侧仍然是HelloWorld，右侧是新的some页面
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);

  // 左侧第3次push: 再次点击左侧"Go somewhere"
  await page.getByRole('button', { name: 'Go somewhere.' }).first().click();
  await page.waitForURL(/\/some\//);
  
  // 验证：左侧仍然是HelloWorld，右侧是第三个some页面
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);

  // 浏览器回退一次
  await page.goBack();
  await page.waitForTimeout(100); // 等待导航完成

  // 验证：回退后左侧应该是HelloWorld，右侧是第2次push的some页面
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);

  // 右侧replace: 点击右侧的"replace somewhere"
  await page.getByRole('button', { name: 'replace somewhere.' }).last().click();
  await page.waitForURL(/\/some\//);

  // 验证：左侧仍然是HelloWorld，右侧是replace后的some页面
  await expect(page.getByText('Hello World')).toBeVisible(); 
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);

  // 浏览器前进一次
  await page.goForward();
  await page.waitForTimeout(100); // 等待导航完成

  // 验证：前进后应该回到第3次push的状态，左侧HelloWorld，右侧是第3次push的some页面
  // 而不是显示replace的内容
  await expect(page.getByText('Hello World')).toBeVisible();
  await expect(page.getByText(/This is a test page. The id is/)).toHaveCount(1);
  
  // 确保没有显示replace页面的placeholder
  await expect(page.getByText('This is a SplitScreen placeholder.')).not.toBeVisible();
});
