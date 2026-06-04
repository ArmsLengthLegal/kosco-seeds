'use client'

import { useEffect, useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { getPendingCount, syncPendingInspections } from '@/lib/offline/sync'

export default function SyncBadge() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(true)

  const handleSync = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    await syncPendingInspections()
    setPending(await getPendingCount())
    setSyncing(false)
  }, [syncing])

  useEffect(() => {
    setOnline(navigator.onLine)
    const updateCount = async () => setPending(await getPendingCount())
    updateCount()
    const interval = setInterval(updateCount, 10000)
    const onOnline = () => { setOnline(true); handleSync() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(interval); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [handleSync])

  if (!online) return (
    <Badge variant="destructive" className="gap-1 text-xs">
      <CloudOff className="h-3 w-3" /> Offline
    </Badge>
  )

  if (pending > 0) return (
    <button onClick={handleSync} disabled={syncing}>
      <Badge className="gap-1 text-xs bg-amber-500 hover:bg-amber-600 cursor-pointer">
        {syncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Cloud className="h-3 w-3" />}
        {pending} pending upload{pending > 1 ? 's' : ''}
      </Badge>
    </button>
  )

  return (
    <Badge variant="outline" className="gap-1 text-xs text-green-700 border-green-200">
      <Cloud className="h-3 w-3" /> Synced
    </Badge>
  )
}
