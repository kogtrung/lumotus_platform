import { useEffect, useRef, useState } from 'react'
import { FileUp, X } from 'lucide-react'
import { lumotoast } from '@/components/ui/Toast'
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

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      lumotoast.error('Chọn file CSV')
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
        lumotoast.warning(`${summary} · ${skippedCount} dòng bỏ qua`)
      } else {
        lumotoast.success(summary)
      }
      if (errors.length > 0) {
        console.warn('Import warnings:', errors)
      }
      setFile(null)
      setTitle('')
      onClose()
      onImported(deck.slug, addedCount, updatedCount)
    } catch (err) {
      lumotoast.error(getApiErrorMessage(err, 'Import thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 8, 20, 0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3D3348] bg-[#1F1A28] shadow-2xl animate-dialog-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Gradient accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#EC4899] to-[#F97316]" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#3D3348] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.1)]">
              <FileUp className="h-5 w-5 text-[#EC4899]" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#F5F0FA]">Import CSV</h2>
              <p className="text-[11px] text-[#8B7A9E]">Nhập dữ liệu flashcard từ file CSV</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B7A9E] transition-all hover:bg-[#252030] hover:text-[#F5F0FA]"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-xs text-[#8B7A9E]">
            Header: <code className="text-[10px] text-[#C4B8D9]">front, back, phonetic, example, hint, image_url, icon</code>
          </p>
          <p className="-mt-2 text-[11px] text-[#8B7A9E]/60">
            Trùng <code className="text-[10px]">front</code> → cập nhật bằng dữ liệu mới (ưu tiên lần import sau).
          </p>

          {!deckRef && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8B7A9E]">
                Tên deck mới
              </label>
              <input
                className={inputClass()}
                placeholder="Lấy từ tên file nếu để trống"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          {/* File picker */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[#3D3348] bg-[#1A1520] px-4 py-5 text-left transition-all hover:border-[#EC4899]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3D3348] bg-[#252030] transition-colors group-hover:border-[#EC4899]">
              <FileUp className="h-5 w-5 text-[#8B7A9E] transition-colors group-hover:text-[#EC4899]" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#F5F0FA] truncate">
                {file ? file.name : 'Chọn file .csv'}
              </p>
              <p className="mt-0.5 text-xs text-[#8B7A9E]">UTF-8, tối đa 500 thẻ / lần</p>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#3D3348] bg-[#252030] px-4 py-2 text-sm font-semibold text-[#8B7A9E] transition-all hover:border-[#3D3348] hover:bg-[#2D2538] hover:text-[#F5F0FA]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#F472B6] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang import...
                </>
              ) : (
                <>
                  <FileUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Import
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
