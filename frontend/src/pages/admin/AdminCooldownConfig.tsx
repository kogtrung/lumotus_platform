import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Clock, RefreshCw, Save, AlertTriangle } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { cn } from '@/utils/cn'
import { lumotoast } from '@/components/ui/Toast'

interface SettingsForm {
  enabled: boolean
  minSecondsBetweenAttempts: number
  maxAttemptsPerQuizPerDay: number
  maxTotalAttemptsPerDay: number
  maxTotalAttemptsPerWeek: number
}

function SettingsInput({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center font-mono text-sm font-medium text-gray-900 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}

export default function AdminCooldownConfig() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'cooldown-settings'],
    queryFn: () => adminApi.getCooldownSettings().then((r) => r.data),
    staleTime: 30_000,
  })

  const [form, setForm] = useState<SettingsForm>({
    enabled: true,
    minSecondsBetweenAttempts: 600,
    maxAttemptsPerQuizPerDay: 5,
    maxTotalAttemptsPerDay: 20,
    maxTotalAttemptsPerWeek: 50,
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Sync form when settings load
  React.useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        minSecondsBetweenAttempts: settings.minSecondsBetweenAttempts,
        maxAttemptsPerQuizPerDay: settings.maxAttemptsPerQuizPerDay,
        maxTotalAttemptsPerDay: settings.maxTotalAttemptsPerDay,
        maxTotalAttemptsPerWeek: settings.maxTotalAttemptsPerWeek,
      })
      setHasChanges(false)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (payload: SettingsForm) => adminApi.updateCooldownSettings(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(['admin', 'cooldown-settings'], response.data)
      lumotoast.success('Đã lưu cài đặt cooldown thành công')
      setHasChanges(false)
    },
    onError: () => {
      lumotoast.error('Không thể lưu cài đặt. Vui lòng thử lại.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'cooldown-settings'] })
    },
  })

  const handleSave = () => {
    updateMutation.mutate(form)
  }

  const formatSeconds = (seconds: number): string => {
    if (seconds < 60) return `${seconds} giây`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`
    return `${Math.floor(seconds / 3600)} giờ`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Cài đặt Cooldown Quiz</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kiểm soát tốc độ và giới hạn số lần làm quiz để chống gian lận
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'cooldown-settings'] })}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm',
              hasChanges
                ? 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700'
                : 'cursor-not-allowed bg-gray-100 text-gray-400',
            )}
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Global Enable/Disable */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              form.enabled ? 'bg-emerald-100' : 'bg-gray-100',
            )}>
              <Shield className={cn('h-5 w-5', form.enabled ? 'text-emerald-600' : 'text-gray-400')} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Bật/Tắt Cooldown</p>
              <p className="text-sm text-gray-500">Khi tắt, tất cả giới hạn sẽ bị vô hiệu hóa</p>
            </div>
          </div>
          <button
            onClick={() => { setForm((f) => ({ ...f, enabled: !f.enabled })); setHasChanges(true) }}
            className={cn(
              'relative h-7 w-12 rounded-full transition-colors',
              form.enabled ? 'bg-emerald-500' : 'bg-gray-300',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                form.enabled ? 'translate-x-6' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        {!form.enabled && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Cooldown đang bị <strong>tắt</strong>. Người dùng có thể spam quiz không giới hạn. Hãy bật lại nếu cần bảo vệ hệ thống.
            </p>
          </div>
        )}
      </div>

      {/* Time Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Clock className="h-5 w-5 text-pink-500" />
          Giới hạn thời gian
        </h2>
        <div className="space-y-3">
          <SettingsInput
            label="Thời gian chờ giữa các lần"
            description="Tối thiểu giây giữa 2 lần thử cùng một quiz"
            value={form.minSecondsBetweenAttempts}
            onChange={(v) => { setForm((f) => ({ ...f, minSecondsBetweenAttempts: v })); setHasChanges(true) }}
            min={1}
            suffix="giây"
          />
        </div>
      </div>

      {/* Attempt Limits */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <Shield className="h-5 w-5 text-purple-500" />
          Giới hạn số lần thử
        </h2>
        <div className="space-y-3">
          <SettingsInput
            label="Mỗi quiz mỗi ngày"
            description="Số lần tối đa một user được thử cùng một quiz trong 24 giờ"
            value={form.maxAttemptsPerQuizPerDay}
            onChange={(v) => { setForm((f) => ({ ...f, maxAttemptsPerQuizPerDay: v })); setHasChanges(true) }}
            min={1}
            max={100}
            suffix="lần"
          />
          <SettingsInput
            label="Tổng mỗi ngày"
            description="Số lần tối đa thử tất cả quiz trong 24 giờ"
            value={form.maxTotalAttemptsPerDay}
            onChange={(v) => { setForm((f) => ({ ...f, maxTotalAttemptsPerDay: v })); setHasChanges(true) }}
            min={1}
            max={500}
            suffix="lần"
          />
          <SettingsInput
            label="Tổng mỗi tuần"
            description="Số lần tối đa thử tất cả quiz trong 7 ngày"
            value={form.maxTotalAttemptsPerWeek}
            onChange={(v) => { setForm((f) => ({ ...f, maxTotalAttemptsPerWeek: v })); setHasChanges(true) }}
            min={1}
            max={2000}
            suffix="lần"
          />
        </div>
      </div>

      {/* Current Bypass Info */}
      {settings && (settings.bypassUserId || settings.bypassQuizId) && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-purple-900">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            Bypass hiện tại đang active
          </h2>
          <div className="space-y-2 text-sm text-purple-800">
            {settings.bypassUserId && (
              <p><strong>User ID:</strong> {settings.bypassUserId}</p>
            )}
            {settings.bypassQuizId && (
              <p><strong>Quiz ID:</strong> {settings.bypassQuizId}</p>
            )}
            {settings.bypassExpiresAt && (
              <p><strong>Hết hạn:</strong> {new Date(settings.bypassExpiresAt).toLocaleString('vi-VN')}</p>
            )}
            {settings.bypassReason && (
              <p><strong>Lý do:</strong> {settings.bypassReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-gray-900">Tóm tắt cài đặt</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryItem
            label="Trạng thái"
            value={form.enabled ? 'Bật' : 'Tắt'}
            color={form.enabled ? 'emerald' : 'gray'}
          />
          <SummaryItem
            label="Chờ giữa lần"
            value={formatSeconds(form.minSecondsBetweenAttempts)}
            color="pink"
          />
          <SummaryItem
            label="Mỗi quiz/ngày"
            value={`${form.maxAttemptsPerQuizPerDay} lần`}
            color="orange"
          />
          <SummaryItem
            label="Tổng/ngày"
            value={`${form.maxTotalAttemptsPerDay} lần`}
            color="blue"
          />
          <SummaryItem
            label="Tổng/tuần"
            value={`${form.maxTotalAttemptsPerWeek} lần`}
            color="purple"
          />
        </div>
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: 'emerald' | 'pink' | 'orange' | 'blue' | 'purple' | 'gray'
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className={cn(
      'rounded-lg border px-3 py-2 text-center',
      colors[color],
    )}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  )
}
