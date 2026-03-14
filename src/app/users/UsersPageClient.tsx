'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth-actions'
import { createUser, deleteUser } from './actions'

interface User {
  id: string
  name: string
  pin: string
  role: string
  createdAt: Date
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '👑 Admin',
  MANAGER: '🔧 Quản lý',
  VIEWER: '👁 Xem',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

export default function UsersPageClient({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', pin: '', role: 'VIEWER' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await createUser(form)
      setSuccess(`Đã thêm tài khoản "${form.name}"`)
      setForm({ name: '', pin: '', role: 'VIEWER' })
      setShowAdd(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa tài khoản "${name}"?`)) return
    try {
      await deleteUser(id)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phân quyền</h1>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 rounded-xl bg-red-50 text-red-600 font-medium active:scale-95 transition-all"
        >
          Đăng xuất
        </button>
      </header>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm">{success}</div>}

      <div className="space-y-3 mb-6">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || ROLE_COLORS.VIEWER}`}>
                {ROLE_LABELS[u.role] || u.role}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-400 font-mono">PIN: {'•'.repeat(u.pin.length)}</p>
              </div>
            </div>
            {u.id !== currentUserId && (
              <button
                onClick={() => handleDelete(u.id, u.name)}
                className="p-2 rounded-xl bg-red-50 text-red-400 active:scale-90 transition-all text-sm"
              >
                🗑
              </button>
            )}
            {u.id === currentUserId && (
              <span className="text-xs text-blue-500 font-medium">Bạn</span>
            )}
          </div>
        ))}
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold active:scale-95 transition-all"
        >
          + Thêm tài khoản mới
        </button>
      ) : (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Thêm tài khoản mới</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
            <input
              type="text"
              required
              placeholder="VD: Nhân viên kho 1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã PIN (4-6 số)</label>
            <input
              type="password"
              inputMode="numeric"
              required
              minLength={4}
              maxLength={6}
              placeholder="Nhập mã PIN..."
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VIEWER">👁 Xem — chỉ nhập/xuất kho, không sửa sản phẩm</option>
              <option value="MANAGER">🔧 Quản lý — nhập/xuất + sửa sản phẩm</option>
              <option value="ADMIN">👑 Admin — toàn quyền (xóa, quản lý user)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Thêm'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 bg-gray-50 rounded-2xl p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">Mô tả cấp độ quyền</h4>
        <table className="w-full text-xs text-gray-600">
          <thead>
            <tr className="text-left">
              <th className="pb-2">Quyền</th>
              <th className="pb-2 text-center">Xem</th>
              <th className="pb-2 text-center">Quản lý</th>
              <th className="pb-2 text-center">Admin</th>
            </tr>
          </thead>
          <tbody className="space-y-1">
            {[
              ['Nhập / Xuất kho', true, true, true],
              ['Xem báo cáo', true, true, true],
              ['Thêm / Sửa sản phẩm', false, true, true],
              ['Xóa sản phẩm', false, false, true],
              ['Quản lý tài khoản', false, false, true],
            ].map(([label, v, m, a]) => (
              <tr key={String(label)}>
                <td className="py-1">{label}</td>
                <td className="text-center">{v ? '✅' : '❌'}</td>
                <td className="text-center">{m ? '✅' : '❌'}</td>
                <td className="text-center">{a ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
