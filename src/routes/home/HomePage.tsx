import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createRoom, joinRoom } from '@/lib/api/rooms'
import { useSessionStore } from '@/store/sessionStore'

type Mode = 'select' | 'create' | 'join'

export function HomePage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)

  const [mode, setMode] = useState<Mode>('select')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const { room, participant } = await createRoom(nickname.trim())
      setSession({
        participantId: participant.id,
        participantToken: participant.token,
        nickname: participant.nickname,
        roomCode: room.code,
        roomId: room.id,
      })
      navigate(`/room/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルームの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !roomCode.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const { room, participant } = await joinRoom(roomCode.trim().toUpperCase(), nickname.trim())
      setSession({
        participantId: participant.id,
        participantToken: participant.token,
        nickname: participant.nickname,
        roomCode: room.code,
        roomId: room.id,
      })
      navigate(`/room/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-bold text-amber-400 mb-2">meshi-vote</h1>
          <p className="text-slate-400 text-sm">クラスで今日のご飯を決めよう</p>
        </div>

        {mode === 'select' && (
          <div className="flex flex-col gap-3">
            <Button onClick={() => setMode('create')} size="lg">
              ＋ ルームを作る
            </Button>
            <Button onClick={() => setMode('join')} variant="secondary" size="lg">
              ルームに参加する
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input
              id="create-nickname"
              label="ニックネーム"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: たろう"
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" isLoading={isLoading} disabled={!nickname.trim()} size="lg">
              ルームを作成
            </Button>
            <button
              type="button"
              onClick={() => { setMode('select'); setError(null) }}
              className="text-sm text-slate-500 hover:text-slate-300 text-center"
            >
              ← 戻る
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              id="join-code"
              label="ルームコード"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="例: AB3C7E"
              required
              autoFocus
            />
            <Input
              id="join-nickname"
              label="ニックネーム"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: はなこ"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!nickname.trim() || !roomCode.trim()}
              size="lg"
            >
              参加する
            </Button>
            <button
              type="button"
              onClick={() => { setMode('select'); setError(null) }}
              className="text-sm text-slate-500 hover:text-slate-300 text-center"
            >
              ← 戻る
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
