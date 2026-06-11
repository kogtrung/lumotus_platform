import { useEffect, useRef, useState } from 'react'
import { Loader2, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

interface CardAudioButtonProps {
  audioUrl: string
  preload?: boolean
  className?: string
}

export default function CardAudioButton({ audioUrl, preload = false, className }: CardAudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
    setLoading(false)
    if (preload) {
      audio.preload = 'auto'
      audio.load()
    } else {
      audio.preload = 'none'
    }
  }, [audioUrl, preload])

  const handlePlay = async (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(false)
      return
    }

    setLoading(true)
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      toast.error('Không phát được audio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePlay}
        className={cn('review-audio-btn', playing && 'review-audio-btn--playing', className)}
        aria-label={playing ? 'Dừng phát' : 'Phát phát âm'}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Volume2 className="h-5 w-5" strokeWidth={2.25} />
        )}
      </button>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload={preload ? 'auto' : 'none'}
        className="hidden"
        onEnded={() => setPlaying(false)}
      />
    </>
  )
}
