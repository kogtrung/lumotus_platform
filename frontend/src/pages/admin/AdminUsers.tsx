import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { adminApi, type UserAdmin } from '@/api/admin'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 10

function UserRow({
  user,
  onToggleRole,
  onToggleActive,
}: {
  user: UserAdmin
  onToggleRole: () => void
  onToggleActive: () => void
}) {
  return (
    <tr className="border-b border-gray-200 transition-colors hover:bg-white/40">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EC4899] to-[#F97316] text-sm font-bold text-white">
            {user.username[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{user.username}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
            user.role === 'ADMIN'
              ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30'
              : 'bg-gray-200 text-gray-600 border border-gray-200',
          )}
        >
          {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
          {user.role}
        </span>
      </td>
      <td className="hidden md:table-cell px-4 py-4 text-center text-sm text-gray-600">
        {user.xp.toLocaleString()} XP
      </td>
      <td className="hidden sm:table-cell px-4 py-4 text-center text-sm text-gray-600">
        {user.streak} 🔥
      </td>
      <td className="hidden lg:table-cell px-4 py-4 text-center text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('vi')}
      </td>
      <td className="px-4 py-4 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
            user.active
              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
              : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30',
          )}
        >
          {user.active ? (
            <>
              <CheckCircle className="h-3 w-3" /> Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" /> Inactive
            </>
          )}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          {/* Toggle Role */}
          <button
            onClick={onToggleRole}
            title={user.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
            className={cn(
              'flex items-center justify-center rounded-lg p-2 transition-all',
              user.role === 'ADMIN'
                ? 'bg-[#EC4899]/10 text-[#EC4899] hover:bg-[#EC4899]/20'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-600',
            )}
          >
            <Shield className="h-4 w-4" />
          </button>
          {/* Toggle Active */}
          <button
            onClick={onToggleActive}
            title={user.active ? 'Deactivate user' : 'Activate user'}
            className={cn(
              'flex items-center justify-center rounded-lg p-2 transition-all',
              user.active
                ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                : 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20',
            )}
          >
            {user.active ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Users query
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.getUsers({ page, size: PAGE_SIZE }).then((r) => r.data),
    staleTime: 10_000,
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const handleToggleRole = (user: UserAdmin) => {
    updateMutation.mutate({
      userId: user.id,
      payload: { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' },
    })
  }

  const handleToggleActive = (user: UserAdmin) => {
    updateMutation.mutate({
      userId: user.id,
      payload: { active: !user.active },
    })
  }

  const users = usersData?.content ?? []
  const totalPages = usersData?.totalPages ?? 1
  const totalElements = usersData?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản và phân quyền người dùng
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200/60 bg-white/60 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EC4899]/50 focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Tổng cộng: {totalElements} người dùng
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/60">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200/30" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-gray-500" />
            <p className="text-gray-500">Không có người dùng nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-white/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Vai trò
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      XP
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Streak
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tham gia
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onToggleRole={() => handleToggleRole(user)}
                      onToggleActive={() => handleToggleActive(user)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                    page === 0
                      ? 'cursor-not-allowed text-gray-500/40'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                    page >= totalPages - 1
                      ? 'cursor-not-allowed text-gray-500/40'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
                  )}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
