const SITE_NAME = '내한공연 트래커'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5; }
  .header { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 24px; letter-spacing: -0.01em; }
  h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 16px; line-height: 1.4; }
  p { font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 12px; }
  .highlight { background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .highlight-label { font-size: 12px; color: #6b7280; margin: 0 0 4px; }
  .highlight-value { font-size: 16px; font-weight: 600; color: #111827; margin: 0; }
  .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 16px 0; }
  .links { margin: 16px 0; }
  .links a { display: inline-block; font-size: 13px; color: #2563eb; text-decoration: none; margin-right: 12px; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
  .footer a { color: #9ca3af; text-decoration: underline; }
`

function layout(content: string, unsubscribeToken?: string) {
  const unsubscribeUrl = unsubscribeToken
    ? `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}`
    : '#'

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">${SITE_NAME}</div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${SITE_NAME}</p>
      ${unsubscribeToken ? `<p><a href="${unsubscribeUrl}">구독 취소</a></p>` : ''}
    </div>
  </div>
</body>
</html>`
}

export function ticketOpenReminderHtml(params: {
  artistName: string
  performanceTitle: string
  ticketOpenAt: string
  sourceLinks: { source: string; url: string }[]
  unsubscribeToken?: string
}) {
  const content = `
    <h1>티켓 오픈 알림</h1>
    <p><strong>${params.artistName}</strong>의 공연 티켓이 곧 오픈됩니다.</p>
    <div class="highlight">
      <p class="highlight-label">공연</p>
      <p class="highlight-value">${params.performanceTitle}</p>
    </div>
    <div class="highlight">
      <p class="highlight-label">티켓 오픈 시간</p>
      <p class="highlight-value">${params.ticketOpenAt}</p>
    </div>
    <p>아래 링크에서 티켓을 예매하세요.</p>
    <div class="links">
      ${params.sourceLinks.map((link) => `<a href="${link.url}">${link.source}</a>`).join('')}
    </div>
  `
  return layout(content, params.unsubscribeToken)
}

export function newPerformanceAlertHtml(params: {
  artistName: string
  performanceTitle: string
  venue: string
  startDate: string
  sourceLinks: { source: string; url: string }[]
  unsubscribeToken?: string
}) {
  const content = `
    <h1>새 공연 등록 알림</h1>
    <p><strong>${params.artistName}</strong>의 새로운 내한공연이 등록되었습니다!</p>
    <div class="highlight">
      <p class="highlight-label">공연</p>
      <p class="highlight-value">${params.performanceTitle}</p>
    </div>
    <div class="highlight">
      <p class="highlight-label">공연장</p>
      <p class="highlight-value">${params.venue}</p>
    </div>
    <div class="highlight">
      <p class="highlight-label">공연 시작일</p>
      <p class="highlight-value">${params.startDate}</p>
    </div>
    <div class="links">
      ${params.sourceLinks.map((link) => `<a href="${link.url}">${link.source} 바로가기</a>`).join('')}
    </div>
  `
  return layout(content, params.unsubscribeToken)
}

export function verificationEmailHtml(params: {
  verifyUrl: string
}) {
  const content = `
    <h1>이메일 인증</h1>
    <p>${SITE_NAME}의 알림 구독을 위해 이메일 인증이 필요합니다.</p>
    <p>아래 버튼을 클릭하여 이메일을 인증해주세요.</p>
    <a href="${params.verifyUrl}" class="btn">이메일 인증하기</a>
    <p style="font-size: 12px; color: #9ca3af;">본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
  `
  return layout(content)
}
