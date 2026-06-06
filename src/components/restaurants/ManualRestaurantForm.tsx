import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { AddRestaurantInput } from '@/lib/api/restaurants'

interface Props {
  onSubmit: (data: AddRestaurantInput) => Promise<void>
}

export function ManualRestaurantForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [isDelivery, setIsDelivery] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim() || undefined,
        is_delivery: isDelivery,
        external_url: externalUrl.trim() || undefined,
      })
      setName('')
      setAddress('')
      setIsDelivery(false)
      setExternalUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="restaurant-name"
        label="お店の名前 *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: 東京ラーメン"
        required
      />
      <Input
        id="restaurant-address"
        label="住所（任意）"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="例: 渋谷区道玄坂1-1-1"
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isDelivery}
          onChange={(e) => setIsDelivery(e.target.checked)}
          className="w-4 h-4 accent-amber-500"
        />
        <span className="text-sm text-slate-300">🛵 デリバリーで注文する</span>
      </label>

      {isDelivery && (
        <Input
          id="external-url"
          label="注文ページURL（任意）"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" isLoading={isSubmitting} disabled={!name.trim()}>
        + お店を追加
      </Button>
    </form>
  )
}
