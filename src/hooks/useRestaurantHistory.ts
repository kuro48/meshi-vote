import { useState, useCallback } from 'react'

const STORAGE_KEY = 'meshi-vote:restaurant-history'
const MAX_HISTORY = 20

export interface HistoryEntry {
  name: string
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function useRestaurantHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => h.name.toLowerCase() !== entry.name.toLowerCase()
      )
      const next = [entry, ...filtered].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  return { history, addToHistory, clearHistory }
}
