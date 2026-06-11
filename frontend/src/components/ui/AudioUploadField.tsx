import { useRef, useState } from 'react'
import { Loader2, Music, Play, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { mediaApi } from '@/api/media'
import { getApiErrorMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'

interface AudioUploadFieldProps {
  label: string
  value?: string | null
  onChange: (url: string | null) => void
  className?: string
}

export default function AudioUploadField({ label, value, onChange, className }: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLAudioElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      toast.error('Chỉ chấp nhận file âm thanh')
      return
    }
    setUploading(true)
    try {
      const res = await mediaApi.upload(file, 'audio')
      onChange(res.data.url)
      toast.success('Đã tải audio lên')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải audio'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]',
            uploading && 'opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          ) : (
            <Music className="h-6 w-6 text-[var(--color-text-muted)]" />
          )}
        </button>
        <div className="min-w-0 flex-1 text-sm">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="font-medium text-[var(--color-primary)] hover:underline disabled:opacity-60"
          >
            Chọn audio
          </button>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">MP3, WAV, OGG, WebM · tối đa 5MB</p>
          {value && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => previewRef.current?.play()}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              >
                <Play className="h-3 w-3" fill="currentColor" />
                Nghe thử
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)] hover:underline"
              >
                <X className="h-3 w-3" />
                Xóa audio
              </button>
              <audio ref={previewRef} src={value} preload="none" className="hidden" />
            </div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
