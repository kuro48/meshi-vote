import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRestaurantHistory } from '@/hooks/useRestaurantHistory'
import type { AddRestaurantInput } from '@/lib/api/restaurants'

interface Props {
  onSubmit: (data: AddRestaurantInput) => Promise<void>
}

export function ManualRestaurantForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [isDelivery, setIsDelivery] = useState(false)
  const [externalUrl, setExternalUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { history, addToHistory } = useRestaurantHistory()

  const suggestions = name.trim()
    ? history.filter((h) => h.name.toLowerCase().includes(name.toLowerCase()))
    : history.slice(0, 5)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const applySuggestion = (entry: { name: string }) => {
    setName(entry.name)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const data: AddRestaurantInput = {
        name: name.trim(),
        is_delivery: isDelivery,
        external_url: externalUrl.trim() || undefined,
      }
      await onSubmit(data)
      addToHistory({ name: name.trim() })
      setName('')
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
      <div className="relative" ref={suggestionsRef}>
        <Input
          id="restaurant-name"
          label="お店の名前 *"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="例: 東京ラーメン"
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
            {suggestions.map((entry, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => applySuggestion(entry)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors"
                >
                  <p className="text-sm text-slate-100">{entry.name}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
