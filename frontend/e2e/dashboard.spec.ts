import { test, expect } from '@playwright/test'

test.describe('대시보드', () => {
  test('대시보드 페이지 접속', async ({ page }) => {
    await page.goto('/')
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('대시보드')
    
    // 통계 카드 확인
    await expect(page.locator('text=전체 호스트')).toBeVisible()
    await expect(page.locator('text=활성 티켓')).toBeVisible()
    await expect(page.locator('text=Critical 티켓')).toBeVisible()
    await expect(page.locator('text=정상 호스트')).toBeVisible()
  })

  test('시스템 상태 표시', async ({ page }) => {
    await page.goto('/')
    
    // 시스템 상태 섹션 확인
    await expect(page.locator('text=시스템 상태')).toBeVisible()
    await expect(page.locator('text=Backend API')).toBeVisible()
  })

  test('빠른 시작 가이드 표시', async ({ page }) => {
    await page.goto('/')
    
    // 시작하기 가이드 확인
    await expect(page.locator('text=시작하기')).toBeVisible()
    await expect(page.locator('text=호스트 메뉴에서 관리할 서버를 등록하세요')).toBeVisible()
  })

  test('호스트 추가 링크 동작', async ({ page }) => {
    await page.goto('/')
    
    // 호스트 추가 버튼 클릭
    await page.click('text=호스트 추가')
    
    // 호스트 생성 페이지로 이동 확인
    await expect(page).toHaveURL('/hosts/new')
  })

  test('티켓 생성 링크 동작', async ({ page }) => {
    await page.goto('/')
    
    // 티켓 생성 버튼 클릭
    await page.click('text=티켓 생성')
    
    // 티켓 생성 페이지로 이동 확인
    await expect(page).toHaveURL('/tickets/new')
  })
})
