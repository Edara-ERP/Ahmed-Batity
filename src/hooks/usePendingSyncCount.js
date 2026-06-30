import { useState, useEffect } from 'react'
import { getPendingSyncCount } from '../lib/db.js'
import { onSyncEvent, runSync } from '../lib/syncEngine.js'

export function usePendingSyncCount() {
  const [count, setCount] = useState(0)

  const refresh = () => getPendingSyncCount().then(setCount)

  useEffect(() => {
    refresh()
    const unsubscribe = onSyncEvent(() => refresh())
    window.addEventListener('online', refresh)
    const interval = setInterval(refresh, 10000)
    return () => {
      unsubscribe()
      window.removeEventListener('online', refresh)
      clearInterval(interval)
    }
  }, [])

  return count
}

export { runSync }
