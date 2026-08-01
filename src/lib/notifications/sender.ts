import { Resend } from 'resend'
import {
  ticketOpenReminderHtml,
  newPerformanceAlertHtml,
  verificationEmailHtml,
  newSubmissionAdminAlertHtml,
  submissionReceivedHtml,
  submissionApprovedHtml,
  submissionRejectedHtml,
} from './templates'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM_EMAIL = process.env.EMAIL_FROM || '내한공연 트래커 <noreply@example.com>'

export async function sendTicketOpenReminder(params: {
  to: string
  artistName: string
  performanceTitle: string
  ticketOpenAt: string
  sourceLinks: { source: string; url: string }[]
  unsubscribeToken?: string
}) {
  const html = ticketOpenReminderHtml({
    artistName: params.artistName,
    performanceTitle: params.performanceTitle,
    ticketOpenAt: params.ticketOpenAt,
    sourceLinks: params.sourceLinks,
    unsubscribeToken: params.unsubscribeToken,
  })

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[티켓 오픈 알림] ${params.artistName} - ${params.performanceTitle}`,
    html,
  })

  if (error) {
    console.error('Failed to send ticket open reminder:', error)
    throw error
  }
}

export async function sendNewPerformanceAlert(params: {
  to: string
  artistName: string
  performanceTitle: string
  venue: string
  startDate: string
  sourceLinks: { source: string; url: string }[]
  unsubscribeToken?: string
}) {
  const html = newPerformanceAlertHtml({
    artistName: params.artistName,
    performanceTitle: params.performanceTitle,
    venue: params.venue,
    startDate: params.startDate,
    sourceLinks: params.sourceLinks,
    unsubscribeToken: params.unsubscribeToken,
  })

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[새 공연] ${params.artistName} - ${params.performanceTitle}`,
    html,
  })

  if (error) {
    console.error('Failed to send new performance alert:', error)
    throw error
  }
}

export async function sendVerificationEmail(params: {
  to: string
  verifyUrl: string
}) {
  const html = verificationEmailHtml({
    verifyUrl: params.verifyUrl,
  })

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: '[내한공연 트래커] 이메일 인증',
    html,
  })

  if (error) {
    console.error('Failed to send verification email:', error)
    throw error
  }
}

export async function sendNewSubmissionAdminAlert(params: {
  submissionId: string
  submitterEmail: string
  title: string
  artistLabel: string
  startDate: string
  venue: string | null
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set — skipping admin submission alert.')
    return
  }
  const html = newSubmissionAdminAlertHtml(params)
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `[공연 제보] ${params.title}`,
    html,
  })
  if (error) {
    console.error('Failed to send admin submission alert:', error)
  }
}

export async function sendSubmissionReceived(params: {
  to: string
  title: string
  artistLabel: string
  startDate: string
}) {
  const html = submissionReceivedHtml({
    title: params.title,
    artistLabel: params.artistLabel,
    startDate: params.startDate,
  })
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: '[내한공연 트래커] 공연 제보가 접수되었습니다',
    html,
  })
  if (error) {
    console.error('Failed to send submission received email:', error)
  }
}

export async function sendSubmissionApproved(params: {
  to: string
  title: string
  performanceId: string
}) {
  const html = submissionApprovedHtml({
    title: params.title,
    performanceId: params.performanceId,
  })
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[공연 등록 완료] ${params.title}`,
    html,
  })
  if (error) {
    console.error('Failed to send submission approved email:', error)
  }
}

export async function sendSubmissionRejected(params: {
  to: string
  title: string
  reason: string
}) {
  const html = submissionRejectedHtml({
    title: params.title,
    reason: params.reason,
  })
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[공연 제보] 등록 미진행 안내`,
    html,
  })
  if (error) {
    console.error('Failed to send submission rejected email:', error)
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jpop.ernebi.org'

// 사설 공연 예약 확인 메일 (org 예약)
export async function sendReservationConfirmation(params: {
  to: string
  orgName: string
  performanceTitle: string
  performanceId: string
  showLabel: string | null
  partySize: number
  cancelToken: string
}) {
  const cancelUrl = `${SITE_URL}/reservations/cancel/${params.cancelToken}`
  const perfUrl = `${SITE_URL}/performances/${params.performanceId}`
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 8px">예약이 접수되었습니다</h2>
      <p style="color:#555;margin:0 0 20px">${params.orgName}</p>
      <div style="background:#f6f6f6;border-radius:12px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-weight:700">${params.performanceTitle}</p>
        ${params.showLabel ? `<p style="margin:0 0 6px;color:#555">${params.showLabel}</p>` : ''}
        <p style="margin:0;color:#555">예약 인원 ${params.partySize}명</p>
      </div>
      <p style="margin:0 0 16px">
        <a href="${perfUrl}" style="color:#5b21b6">공연 정보 보기</a>
      </p>
      <p style="font-size:13px;color:#888;margin:0">
        예약을 취소하려면 <a href="${cancelUrl}" style="color:#888">여기</a>를 눌러주세요.
      </p>
    </div>
  `
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[예약 확인] ${params.performanceTitle}`,
    html,
  })
  if (error) {
    console.error('Failed to send reservation confirmation:', error)
  }
}

// 단체 공지 발송. 성공 시 true.
export async function sendAnnouncementEmail(params: {
  to: string
  orgName: string
  title: string
  body: string
}): Promise<boolean> {
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p style="color:#888;font-size:12px;margin:0 0 4px">${params.orgName} 공지</p>
      <h2 style="margin:0 0 16px">${params.title}</h2>
      <div style="white-space:pre-line;line-height:1.6;color:#333">${escapeHtml(params.body)}</div>
    </div>
  `
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `[${params.orgName}] ${params.title}`,
    html,
  })
  if (error) {
    console.error('Failed to send announcement email:', error)
    return false
  }
  return true
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
