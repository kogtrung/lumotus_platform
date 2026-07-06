import { useEffect, useRef, useState } from 'react'
import { Loader2, Volume2, VolumeX } from 'lucide-react'
import { lumotoast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

interface CardAudioButtonProps {
  audioUrl?: string | null
  preload?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
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
      lumotoast.info('Thẻ chưa có audio')
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
      lumotoast.error('Không phát được audio')
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
          'group flex items-center justify-center transition-opacity hover:opacity-80',
          playing ? 'opacity-100' : 'opacity-90',
          !hasAudio && 'cursor-default',
          className,
        )}
        aria-label={hasAudio ? (playing ? 'Dừng phát' : 'Phát phát âm') : 'Chưa có audio'}
        title={hasAudio ? 'Phát phát âm' : 'Chưa có audio'}
      >
        {loading ? (
          <Loader2 className={cn(sizeMap[size], 'animate-spin text-[#F472B6]')} />
        ) : hasAudio ? (
          <Volume2 className={cn(sizeMap[size], playing ? 'text-[#34D399]' : 'text-[#F472B6]', 'transition-colors')} strokeWidth={2.25} />
        ) : (
          <VolumeX className={cn(sizeMap[size], 'text-[#C4B8D9]')} strokeWidth={2.25} />
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