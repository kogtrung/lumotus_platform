import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileUp, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { lumotoast } from '@/components/ui/Toast'
import { decksApi } from '@/api/decks'
import { topicsApi } from '@/api/topics'
import { inputClassLight } from '@/components/ui/inputClass'
import { getApiErrorMessage } from '@/utils/apiError'
import type { Topic } from '@/types/deck'

interface AdminImportCsvDialogProps {
  open: boolean
  onClose: () => void
  onImported: (deckSlug: string, addedCount: number, updatedCount: number) => void
}

async function normalizeCsv(file: File): Promise<File> {
  const buf = await file.slice(0, 3).arrayBuffer()
  const hasBom = buf.byteLength >= 3 &&
    new Uint8Array(buf)[0] === 0xEF &&
    new Uint8Array(buf)[1] === 0xBB &&
    new Uint8Array(buf)[2] === 0xBF
  if (!hasBom) return file
  const text = await file.text()
  const normalized = text.replace(/^\uFEFF/, '')
  return new File([normalized], file.name, { type: file.type || 'text/csv' })
}

export default function AdminImportCsvDialog({ open, onClose, onImported }: AdminImportCsvDialogProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [topicSearch, setTopicSearch] = useState('')
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])

  useEffect(() => {
    if (!open) return
    topicsApi.list().then((r) => setTopics(r.data)).catch(() => {})
  }, [open])

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

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase()),
  )

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      lumotoast.error('Chọn file CSV')
      return
    }
    setLoading(true)
    try {
      const normalized = await normalizeCsv(file)
      const res = await decksApi.importCsv(normalized, {
        title: title || undefined,
        topicIds: selectedTopicIds.size > 0 ? Array.from(selectedTopicIds) : undefined,
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'decks'] })
      queryClient.invalidateQueries({ queryKey: ['decks'] })
      setFile(null)
      setTitle('')
      setSelectedTopicIds(new Set())
      setTopicSearch('')
      onClose()
      onImported(deck.slug, addedCount, updatedCount)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Import thất bại')
      lumotoast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
              <FileUp className="h-5 w-5 text-gray-600" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Import CSV</h2>
              <p className="text-[11px] text-gray-400">Nhập dữ liệu flashcard từ file CSV</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              Tên deck mới
            </label>
            <input
              className={inputClassLight()}
              placeholder="Lấy từ tên file nếu để trống"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Topic search */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              Chủ đề
            </label>
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Tìm kiếm chủ đề..."
              className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/10"
            />
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
              {filteredTopics.length === 0 ? (
                <p className="text-xs text-gray-400">Không tìm thấy</p>
              ) : (
                filteredTopics.map((topic) => {
                  const selected = selectedTopicIds.has(topic.id)
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={topicChipClass(selected, topic.colorHex ?? '#6366F1')}
                    >
                      {topic.icon && <span className="mr-1">{topic.icon}</span>}
                      {topic.name}
                    </button>
                  )
                })
              )}
            </div>
            {selectedTopicIds.size > 0 && (
              <p className="mt-1 text-[10px] text-gray-400">
                Đã chọn: {selectedTopicIds.size} chủ đề
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Header: <code className="text-[10px] text-gray-600">front, back, phonetic, example, hint, image_url, icon</code>
          </p>

          {/* File picker */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-left transition-all hover:border-gray-400"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors group-hover:border-gray-400">
              <FileUp className="h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700 truncate">
                {file ? file.name : 'Chọn file .csv'}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">UTF-8, tối đa 500 thẻ / lần</p>
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
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>,
    document.body,
  )
}

function topicChipClass(selected: boolean, _color: string) {
  return [
    'rounded-full border px-2 py-0.5 text-xs font-medium transition-all duration-150 cursor-pointer',
    selected
      ? 'border-[#6366F1] bg-[rgba(99,102,241,0.1)] text-[#6366F1]'
      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700',
  ].join(' ')
}
