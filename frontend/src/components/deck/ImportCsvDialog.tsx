import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { decksApi } from '@/api/decks'
import { inputClass } from '@/components/ui/inputClass'
import { getApiErrorMessage } from '@/utils/apiError'

interface ImportCsvDialogProps {
  open: boolean
  deckRef?: string
  onClose: () => void
  onImported: (deckSlug: string, addedCount: number, updatedCount: number) => void
}

export default function ImportCsvDialog({
  open,
  deckRef,
  onClose,
  onImported,
}: ImportCsvDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Chọn file CSV')
      return
    }
    setLoading(true)
    try {
      const res = await decksApi.importCsv(file, {
        deckRef,
        title: deckRef ? undefined : title || undefined,
      })
      const { addedCount, updatedCount, skippedCount, errors, deck } = res.data
      const parts: string[] = []
      if (addedCount > 0) parts.push(`${addedCount} thẻ mới`)
      if (updatedCount > 0) parts.push(`${updatedCount} thẻ cập nhật`)
      const summary = parts.length > 0 ? parts.join(' · ') : 'Không có thẻ nào được xử lý'
      if (skippedCount > 0) {
        toast(`${summary} · ${skippedCount} dòng bỏ qua`, { icon: '⚠️' })
      } else {
        toast.success(summary)
      }
      if (errors.length > 0) {
        console.warn('Import warnings:', errors)
      }
      setFile(null)
      setTitle('')
      onClose()
      onImported(deck.slug, addedCount, updatedCount)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Đóng" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Import CSV</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Header: <code className="text-xs">front, back, phonetic, example, hint, image_url, icon</code>
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Trùng <code className="text-[10px]">front</code> trong deck → cập nhật bằng dữ liệu mới (ưu tiên lần import sau).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!deckRef && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Tên deck mới (tùy chọn)
              </label>
              <input
                className={inputClass()}
                placeholder="Lấy từ tên file nếu để trống"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-6 text-left hover:border-[var(--color-primary)]"
          >
            <FileUp className="h-8 w-8 shrink-0 text-[var(--color-primary)]" />
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-text)]">
                {file ? file.name : 'Chọn file .csv'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">UTF-8, tối đa 500 thẻ / lần</p>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {loading ? 'Đang import...' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
