import { test, expect } from '@playwright/test'

test.describe('호스트 관리', () => {
  test('호스트 목록 페이지 접속', async ({ page }) => {
    await page.goto('/hosts')
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('호스트 관리')
    
    // 호스트 추가 버튼 확인
    await expect(page.locator('text=호스트 추가')).toBeVisible()
  })

  test('호스트 생성 폼 접속', async ({ page }) => {
    await page.goto('/hosts/new')
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('새 호스트 등록')
    
    // 필수 입력 필드 확인
    await expect(page.locator('text=호스트 이름')).toBeVisible()
    await expect(page.locator('text=연결 유형')).toBeVisible()
  })

  test('호스트 생성 폼 유효성 검사', async ({ page }) => {
    await page.goto('/hosts/new')
    
    // 빈 폼 제출 시도
    await page.click('text=저장')
    
    // 유효성 검사 에러 메시지 확인
    await expect(page.locator('text=호스트 이름은 필수입니다')).toBeVisible()
  })

  test('호스트 생성 폼 입력', async ({ page }) => {
    await page.goto('/hosts/new')
    
    // 폼 입력
    await page.fill('input[placeholder="예: web-prod-01"]', 'test-server-01')
    await page.fill('textarea', '테스트 서버 설명')
    
    // SSH 설정 입력
    await page.fill('input[placeholder="10.0.0.1"]', '192.168.1.100')
    await page.fill('input[placeholder="root"]', 'admin')
    
    // 태그 추가
    await page.fill('input[placeholder="태그 입력 후 Enter"]', 'test')
    await page.keyboard.press('Enter')
    
    // 태그 추가 확인
    await expect(page.locator('text=test').first()).toBeVisible()
  })

  test('호스트 목록 필터링', async ({ page }) => {
    await page.goto('/hosts')
    
    // 상태 필터 선택
    await page.selectOption('select', 'ACTIVE')
    
    // 검색 입력
    await page.fill('input[placeholder*="검색"]', 'web')
    
    // URL 파라미터 변경 없이 동작 확인 (클라이언트 사이드)
    await expect(page.locator('input[placeholder*="검색"]')).toHaveValue('web')
  })

  test('네비게이션 동작 확인', async ({ page }) => {
    await page.goto('/hosts')
    
    // 호스트 추가 버튼으로 이동
    await page.click('text=호스트 추가')
    await expect(page).toHaveURL('/hosts/new')
    
    // 뒤로가기
    await page.click('button:has(svg)')  // ArrowLeft 버튼
    await expect(page).toHaveURL('/hosts')
  })
})
