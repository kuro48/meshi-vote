import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'

interface Props {
  roomCode: string
}

export function ShareSheet({ roomCode }: Props) {
  const [copied, setCopied] = useState(false)
  const roomUrl = `${window.location.origin}/room/${roomCode}`

  const copyUrl = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'meshi-vote', url: roomUrl })
      } else {
        await navigator.clipboard.writeText(roomUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share or clipboard not available
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-xs text-slate-400 mb-1">ルームコード</p>
        <p className="text-4xl font-bold tracking-[0.25em] text-amber-400 font-mono">
          {roomCode}
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl">
        <QRCodeSVG value={roomUrl} size={140} />
      </div>

      <Button onClick={copyUrl} variant="secondary" size="sm" className="w-full">
        {copied ? '✓ コピーしました' : '🔗 URLをシェア'}
      </Button>
    </div>
  )
}
