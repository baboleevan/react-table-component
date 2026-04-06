import { test, expect } from '@playwright/test'

test.describe('Preview — 기본 사용법', () => {
  test('페이지에 제목과 DataGrid가 보인다', async ({ page }) => {
    await page.goto('/components/basic')
    await expect(page.getByRole('heading', { name: '기본 사용법' })).toBeVisible()
    await expect(page.locator('.datagrid')).toBeVisible()
  })

  test('가상 스크롤 컨테이너가 존재한다', async ({ page }) => {
    await page.goto('/components/basic')
    const scroll = page.locator('.datagrid__scroll')
    await expect(scroll).toBeVisible()
    await scroll.evaluate((el) => {
      el.scrollTop = 5_000
    })
    await expect(scroll).toBeVisible()
  })
})
