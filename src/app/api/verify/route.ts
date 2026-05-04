import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/?error=invalid_token', request.url)
    )
  }

  const supabase = createServiceClient()

  const { data: subscriber, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('verify_token', token)
    .single()

  if (error || !subscriber) {
    return NextResponse.redirect(
      new URL('/?error=invalid_token', request.url)
    )
  }

  if (subscriber.verified) {
    return NextResponse.redirect(
      new URL('/?message=already_verified', request.url)
    )
  }

  const { error: updateError } = await supabase
    .from('subscribers')
    .update({ verified: true })
    .eq('id', subscriber.id)

  if (updateError) {
    console.error('Failed to verify subscriber:', updateError)
    return NextResponse.redirect(
      new URL('/?error=verification_failed', request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/?message=verified', request.url)
  )
}
