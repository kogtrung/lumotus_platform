import { useEffect } from 'react'
import { reviewApi } from '@/api/review'
import { ReviewRating } from '@/types/review'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface SyncItem {
  cardId: string
  rating: ReviewRating
  ratedAt: string
}

const STORAGE_KEY = 'lumotus_offline_reviews'

export function useOfflineSyncQueue() {
  const queryClient = useQueryClient()

  const getQueue = (): SyncItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  }

  const setQueue = (q: SyncItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
  }

  const addToQueue = (cardId: string, rating: ReviewRating) => {
    const q = getQueue()
    q.push({ cardId, rating, ratedAt: new Date().toISOString() })
    setQueue(q)
    toast.success('Lưu tạm ngoại tuyến', { icon: '💾' })
  }

  const processSync = async () => {
    const q = getQueue()
    if (q.length === 0) return

    try {
      const { data } = await reviewApi.batchRate(q)
      setQueue([]) // Clear after successful sync
      
      const xpInfo = data.totalXpEarned > 0 ? ` (+${data.totalXpEarned} XP)` : ''
      toast.success(`Đã đồng bộ ${q.length} thẻ lên máy chủ!${xpInfo}`, { icon: '☁️', duration: 4000 })
      
      // Force UI updates globally
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['review', 'due'] })
    } catch (error) {
      console.error('Offline sync failed', error)
      // retain in queue until next attempt
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      processSync()
    }
    
    window.addEventListener('online', handleOnline)
    
    // Attempt to sync immediately when hook is minted if network connects
    if (navigator.onLine) {
      processSync()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return { addToQueue, processSync }
}
