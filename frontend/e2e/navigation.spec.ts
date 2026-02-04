import { test, expect } from '@playwright/test'

test.describe('네비게이션', () => {
  test('사이드바 메뉴 동작', async ({ page }) => {
    await page.goto('/')
    
    // 대시보드 메뉴 확인
    await expect(page.locator('nav >> text=대시보드')).toBeVisible()
    await expect(page.locator('nav >> text=호스트')).toBeVisible()
    await expect(page.locator('nav >> text=티켓')).toBeVisible()
  })

  test('대시보드 → 호스트 이동', async ({ page }) => {
    await page.goto('/')
    
    // 호스트 메뉴 클릭
    await page.click('nav >> text=호스트')
    
    // URL 확인
    await expect(page).toHaveURL('/hosts')
    await expect(page.locator('h1')).toContainText('호스트 관리')
  })

  test('대시보드 → 티켓 이동', async ({ page }) => {
    await page.goto('/')
    
    // 티켓 메뉴 클릭
    await page.click('nav >> text=티켓')
    
    // URL 확인
    await expect(page).toHaveURL('/tickets')
    await expect(page.locator('h1')).toContainText('티켓 관리')
  })

  test('로고 클릭 시 대시보드 이동', async ({ page }) => {
    await page.goto('/hosts')
    
    // 로고 클릭
    await page.click('text=kohub')
    
    // 대시보드로 이동 확인
    await expect(page).toHaveURL('/')
  })

  test('404 페이지 표시', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // 404 페이지 표시 확인
    await expect(page.locator('text=페이지를 찾을 수 없습니다')).toBeVisible()
  })
})
