import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/notifications/sender'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type, targetId } = body as {
      email: string
      type: 'all' | 'artist' | 'performance'
      targetId?: string
    }

    if (!email || !type) {
      return NextResponse.json(
        { error: '이메일과 구독 유형은 필수입니다.' },
        { status: 400 }
      )
    }

    if ((type === 'artist' || type === 'performance') && !targetId) {
      return NextResponse.json(
        { error: '아티스트 또는 공연 구독 시 대상 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find or create subscriber
    const verifyToken = crypto.randomUUID()
    const unsubscribeToken = crypto.randomUUID()

    const { data: existing } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email)
      .single()

    let subscriberId: string

    if (existing) {
      subscriberId = existing.id
    } else {
      const { data: newSubscriber, error: insertError } = await supabase
        .from('subscribers')
        .insert({
          email,
          verify_token: verifyToken,
          unsubscribe_token: unsubscribeToken,
          verified: false,
        })
        .select()
        .single()

      if (insertError || !newSubscriber) {
        console.error('Failed to create subscriber:', insertError)
        return NextResponse.json(
          { error: '구독자 생성에 실패했습니다.' },
          { status: 500 }
        )
      }

      subscriberId = newSubscriber.id
    }

    // Check for duplicate subscription
    const subscriptionQuery = supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('type', type)

    if (targetId) {
      subscriptionQuery.eq('target_id', targetId)
    }

    const { data: existingSubscription } = await subscriptionQuery.single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: '이미 동일한 구독이 존재합니다.' },
        { status: 409 }
      )
    }

    // Create subscription
    const { error: subError } = await supabase.from('subscriptions').insert({
      subscriber_id: subscriberId,
      type,
      target_id: targetId || null,
    })

    if (subError) {
      console.error('Failed to create subscription:', subError)
      return NextResponse.json(
        { error: '구독 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // Send verification email if not already verified
    if (!existing?.verified) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const verifyUrl = `${siteUrl}/api/verify?token=${existing?.verify_token || verifyToken}`

      await sendVerificationEmail({
        to: email,
        verifyUrl,
      })
    }

    return NextResponse.json({
      message: existing?.verified
        ? '구독이 완료되었습니다.'
        : '인증 이메일을 발송했습니다. 이메일을 확인해주세요.',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
