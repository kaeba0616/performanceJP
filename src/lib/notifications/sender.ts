import { Resend } from 'resend'
import {
  ticketOpenReminderHtml,
  newPerformanceAlertHtml,
  verificationEmailHtml,
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
