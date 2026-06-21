import { useEffect, useRef, useState } from 'react'
import { Loader2, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

interface CardAudioButtonProps {
  audioUrl?: string | null
  preload?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { btn: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { btn: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { btn: 'h-14 w-14', icon: 'h-6 w-6' },
}

export default function CardAudioButton({
  audioUrl,
  preload = false,
  size = 'md',
  className,
}: CardAudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasAudio = !!audioUrl
  const dims = sizeMap[size]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasAudio) return
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
  }, [audioUrl, preload, hasAudio])

  const handlePlay = async (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()

    if (!hasAudio) {
      toast('Thẻ chưa có audio', { icon: '🔇', duration: 1800 })
      return
    }

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
        disabled={loading}
        className={cn(
          'review-audio-btn',
          dims.btn,
          playing && 'review-audio-btn--playing',
          !hasAudio && 'review-audio-btn--empty',
          className,
        )}
        aria-label={hasAudio ? (playing ? 'Dừng phát' : 'Phát phát âm') : 'Chưa có audio'}
        title={hasAudio ? 'Phát phát âm' : 'Chưa có audio'}
      >
        {loading ? (
          <Loader2 className={cn(dims.icon, 'animate-spin')} />
        ) : hasAudio ? (
          <Volume2 className={dims.icon} strokeWidth={2.25} />
        ) : (
          <VolumeX className={dims.icon} strokeWidth={2.25} />
        )}
      </button>
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload={preload ? 'auto' : 'none'}
          className="hidden"
          onEnded={() => setPlaying(false)}
        />
      )}
    </>
  )
}