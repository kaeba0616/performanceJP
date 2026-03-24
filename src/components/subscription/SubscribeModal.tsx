'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubscribeForm } from './SubscribeForm'

interface SubscribeModalProps {
  artistId?: string
  performanceId?: string
  artistName?: string
  children?: React.ReactNode
}

export function SubscribeModal({
  artistId,
  performanceId,
  artistName,
  children,
}: SubscribeModalProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          children ? undefined : <Button variant="outline" size="sm" />
        }
      >
        {children || '알림 구독'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>알림 구독</DialogTitle>
          <DialogDescription>
            이메일로 티켓 오픈 알림과 새 공연 소식을 받아보세요.
          </DialogDescription>
        </DialogHeader>
        <SubscribeForm
          artistId={artistId}
          performanceId={performanceId}
          artistName={artistName}
        />
      </DialogContent>
    </Dialog>
  )
}
