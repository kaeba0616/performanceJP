import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(unsubscribePage('잘못된 요청입니다.', true), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const supabase = createServerClient()

  const { data: subscriber, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .single()

  if (error || !subscriber) {
    return new NextResponse(
      unsubscribePage('유효하지 않은 토큰입니다.', true),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  // Delete subscriber (cascades to subscriptions)
  const { error: deleteError } = await supabase
    .from('subscribers')
    .delete()
    .eq('id', subscriber.id)

  if (deleteError) {
    console.error('Failed to delete subscriber:', deleteError)
    return new NextResponse(
      unsubscribePage('구독 취소 처리 중 오류가 발생했습니다.', true),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  return new NextResponse(unsubscribePage('구독이 취소되었습니다.'), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function unsubscribePage(message: string, isError = false) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>구독 취소 - 내한공연 트래커</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f6f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 48px 32px;
      text-align: center;
      max-width: 400px;
      border: 1px solid #e5e5e5;
    }
    .site-name {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      color: ${isError ? '#dc2626' : '#111827'};
      margin: 0 0 12px;
    }
    p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    a {
      display: inline-block;
      margin-top: 24px;
      color: #2563eb;
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="site-name">내한공연 트래커</div>
    <h1>${message}</h1>
    <p>${isError ? '다시 시도해주세요.' : '더 이상 알림을 받지 않습니다.'}</p>
    <a href="/">홈으로 돌아가기</a>
  </div>
</body>
</html>`
}
