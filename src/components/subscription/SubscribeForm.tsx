'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SubscriptionType = 'all' | 'artist' | 'performance'

interface SubscribeFormProps {
  artistId?: string
  performanceId?: string
  artistName?: string
  onSuccess?: () => void
}

export function SubscribeForm({
  artistId,
  performanceId,
  artistName,
  onSuccess,
}: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [type, setType] = useState<SubscriptionType>(
    performanceId ? 'performance' : artistId ? 'artist' : 'all'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    isError: boolean
  } | null>(null)

  const typeOptions: { value: SubscriptionType; label: string; disabled: boolean }[] = [
    { value: 'all', label: '전체 알림', disabled: false },
    {
      value: 'artist',
      label: artistName ? `${artistName} 알림` : '이 아티스트 알림',
      disabled: !artistId,
    },
    {
      value: 'performance',
      label: '이 공연 알림',
      disabled: !performanceId,
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!email) {
      setMessage({ text: '이메일을 입력해주세요.', isError: true })
      return
    }

    setIsLoading(true)

    try {
      const targetId =
        type === 'artist'
          ? artistId
          : type === 'performance'
            ? performanceId
            : undefined

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, targetId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ text: data.error, isError: true })
        return
      }

      setMessage({ text: data.message, isError: false })
      setEmail('')
      onSuccess?.()
    } catch {
      setMessage({ text: '오류가 발생했습니다. 다시 시도해주세요.', isError: true })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="subscribe-email" className="text-sm font-medium">
          이메일
        </label>
        <Input
          id="subscribe-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">알림 유형</span>
        <div className="flex flex-col gap-1.5">
          {typeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                type === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted'
              } ${option.disabled ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <input
                type="radio"
                name="subscription-type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                disabled={option.disabled}
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${message.isError ? 'text-destructive' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '처리 중...' : '구독하기'}
      </Button>
    </form>
  )
}
