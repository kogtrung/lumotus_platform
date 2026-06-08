import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { mediaApi, type MediaFolder } from '@/api/media'
import { getApiErrorMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'

interface ImageUploadFieldProps {
  label: string
  value?: string | null
  folder: MediaFolder
  onChange: (url: string | null) => void
  className?: string
}

export default function ImageUploadField({
  label,
  value,
  folder,
  onChange,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh')
      return
    }
    setUploading(true)
    try {
      const res = await mediaApi.upload(file, folder)
      onChange(res.data.url)
      toast.success('Đã tải ảnh lên')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải ảnh'))
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
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]',
            uploading && 'opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-[var(--color-text-muted)]" />
          )}
        </button>
        <div className="min-w-0 flex-1 text-sm">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="font-medium text-[var(--color-primary)] hover:underline disabled:opacity-60"
          >
            Chọn ảnh
          </button>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">JPEG, PNG, WebP, GIF · tối đa 5MB</p>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-danger)] hover:underline"
            >
              <X className="h-3 w-3" />
              Xóa ảnh
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
