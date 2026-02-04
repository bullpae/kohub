import { test, expect } from '@playwright/test'

test.describe('티켓 관리', () => {
  test('티켓 목록 페이지 접속', async ({ page }) => {
    await page.goto('/tickets')
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('티켓 관리')
    
    // 티켓 생성 버튼 확인
    await expect(page.locator('text=티켓 생성')).toBeVisible()
  })

  test('티켓 생성 폼 접속', async ({ page }) => {
    await page.goto('/tickets/new')
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('새 티켓 생성')
    
    // 필수 입력 필드 확인
    await expect(page.locator('text=제목')).toBeVisible()
    await expect(page.locator('text=우선순위')).toBeVisible()
  })

  test('티켓 생성 폼 유효성 검사', async ({ page }) => {
    await page.goto('/tickets/new')
    
    // 빈 폼 제출 시도
    await page.click('text=티켓 생성')
    
    // 유효성 검사 에러 메시지 확인
    await expect(page.locator('text=티켓 제목은 필수입니다')).toBeVisible()
  })

  test('티켓 생성 폼 입력', async ({ page }) => {
    await page.goto('/tickets/new')
    
    // 폼 입력
    await page.fill('input[placeholder*="서버 응답 지연"]', '테스트 티켓 제목')
    await page.fill('textarea', '테스트 티켓 설명입니다.')
    
    // 우선순위 선택
    await page.selectOption('select:has-text("Medium")', 'HIGH')
    
    // 입력 값 확인
    await expect(page.locator('input[placeholder*="서버 응답 지연"]')).toHaveValue('테스트 티켓 제목')
  })

  test('티켓 목록 필터링', async ({ page }) => {
    await page.goto('/tickets')
    
    // 상태 필터 선택
    await page.selectOption('select:has-text("전체 상태")', 'NEW')
    
    // 우선순위 필터 선택
    await page.selectOption('select:has-text("전체 우선순위")', 'CRITICAL')
    
    // 검색 입력
    await page.fill('input[placeholder*="검색"]', '서버')
    
    // 입력 확인
    await expect(page.locator('input[placeholder*="검색"]')).toHaveValue('서버')
  })

  test('네비게이션 동작 확인', async ({ page }) => {
    await page.goto('/tickets')
    
    // 티켓 생성 버튼으로 이동
    await page.click('text=티켓 생성')
    await expect(page).toHaveURL('/tickets/new')
    
    // 취소 버튼으로 돌아가기
    await page.click('text=취소')
    await expect(page).toHaveURL('/tickets')
  })
})
