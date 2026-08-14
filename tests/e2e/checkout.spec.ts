import { expect, test } from '@playwright/test';

/**
 * Luong quan trong nhat cua Phase 1, dung nhu Definition of Done:
 * tim kiem (go sai chinh ta) -> xem chi tiet -> them gio -> thanh toan ->
 * nhan xac nhan don.
 */
test('go sai chinh ta van mua duoc hang', async ({ page }) => {
  await test.step('tim kiem voi chuoi go sai', async () => {
    // "ao thunn": thieu dau VA thua mot chu n.
    await page.goto('/search?q=ao+thunn');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('kết quả cho');
    await expect(page.getByRole('link', { name: 'Áo thun nam cotton' })).toBeVisible();
  });

  await test.step('mo trang chi tiet', async () => {
    await page.getByRole('link', { name: 'Áo thun nam cotton' }).first().click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Áo thun nam cotton');
    await expect(page.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();
  });

  await test.step('them vao gio', async () => {
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
    await expect(page.getByText('Đã thêm vào giỏ')).toBeVisible();
  });

  await test.step('gio hang hien dung mon vua them', async () => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giỏ hàng');
    await expect(page.getByRole('link', { name: 'Áo thun nam cotton' })).toBeVisible();
  });

  await test.step('dat hang', async () => {
    await page.goto('/checkout');

    await page.getByLabel('Email nhận xác nhận đơn').fill('e2e@chongoc.vn');
    await page.getByRole('button', { name: 'Đặt hàng' }).click();

    await page.waitForURL(/\/orders\/ORD-/);
  });

  await test.step('trang xac nhan hien ma don', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cảm ơn bạn đã đặt hàng');
    await expect(page.getByText(/ORD-\d{8}-[0-9A-Z]{6}/)).toBeVisible();
    await expect(page.getByText('e2e@chongoc.vn')).toBeVisible();
  });

  await test.step('gio duoc don sach sau khi dat', async () => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giỏ hàng trống');
  });
});

test('go dung dau van ra ket qua, va lo ra chuoi da chuan hoa', async ({ page }) => {
  await page.goto('/search?q=Áo+THUN');

  await expect(page.getByRole('link', { name: 'Áo thun nam cotton' })).toBeVisible();
  // Chuoi chuan hoa khac chuoi go, nen dong giai thich phai hien ra.
  await expect(page.getByText('tìm theo')).toBeVisible();
});

test('goi y hien khi go khong dau', async ({ page }) => {
  await page.goto('/');

  const search = page.getByRole('combobox').first();
  await search.fill('dong ho');

  const option = page.getByRole('option', { name: 'Đồng hồ cơ dây da' });
  await expect(option).toBeVisible();

  await option.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đồng hồ cơ dây da');
});
