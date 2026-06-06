import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  restaurantName: string
  existingOrder?: string
  onSubmit: (orderText: string) => Promise<void>
}

export function OrderForm({ restaurantName, existingOrder, onSubmit }: Props) {
  const [orderText, setOrderText] = useState(existingOrder ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(!!existingOrder)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderText.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(orderText.trim())
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-green-400 mb-1">✓ 注文済み — {restaurantName}</p>
            <p className="text-slate-200 whitespace-pre-wrap">{orderText}</p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0"
          >
            変更
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-300">
        🛵 <span className="text-amber-400">{restaurantName}</span> への注文内容
      </p>
      <textarea
        value={orderText}
        onChange={(e) => setOrderText(e.target.value)}
        placeholder="例: 醤油ラーメン + チャーハンセット"
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" isLoading={isSubmitting} disabled={!orderText.trim()}>
        注文を送信
      </Button>
    </form>
  )
}
