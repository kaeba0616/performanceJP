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
