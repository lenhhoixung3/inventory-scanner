'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout, approveUser } from '@/lib/auth-actions'
import { deleteUser } from './actions'
import { UserCheck, Trash2, LogOut, Shield, Mail, Phone, Lock, ChevronDown, ChevronUp } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  status: string
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
  VIEWER: 'bg-slate-100 text-slate-600',
}

export default function UsersPageClient({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState('')

  const approvedUsers = users.filter(u => u.status === 'APPROVED')
  const pendingUsers = users.filter(u => u.status === 'PENDING')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  const handleApprove = async (id: string) => {
    if (!tempPassword) {
      alert('Vui lòng nhập mật khẩu để cấp cho người dùng.')
      return
    }
    setError('')
    const res = await approveUser(id, tempPassword)
    if (res.success) {
      setSuccess('Đã phê duyệt tài khoản và sẵn sàng gửi email.')
      setApprovingId(null)
      setTempPassword('')
      router.refresh()
    } else {
      setError(res.error || 'Lỗi khi duyệt.')
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
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </header>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">{success}</div>}

      {/* Yêu cầu chờ duyệt */}
      {pendingUsers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
            <UserCheck size={20} />
            Yêu cầu chờ duyệt ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{u.name}</h3>
                    <div className="text-sm text-slate-500 flex flex-col gap-1 mt-1">
                      <span className="flex items-center gap-1"><Mail size={14} /> {u.email}</span>
                      <span className="flex items-center gap-1"><Phone size={14} /> {u.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {approvingId === u.id ? (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-orange-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Cấp mật khẩu mới</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nhập mật khẩu..." 
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                      />
                      <button 
                        onClick={() => handleApprove(u.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md shadow-green-100"
                      >
                        Duyệt & Gửi
                      </button>
                    </div>
                    <button onClick={() => setApprovingId(null)} className="text-xs text-slate-400 hover:underline">Hủy</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setApprovingId(u.id)}
                    className="w-full mt-2 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-100 hover:bg-orange-600 transition"
                  >
                    Duyệt tài khoản này
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Danh sách nhân viên chính thức */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield size={20} />
          Nhân viên chính thức
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {approvedUsers.map((u, idx) => (
            <div key={u.id} className={`flex items-center justify-between p-4 ${idx !== approvedUsers.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] || ROLE_COLORS.VIEWER}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.id === currentUserId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold">LÀ BẠN</span>}
                {u.id !== currentUserId && (
                  <button 
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bảng phân quyền */}
      <section className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Thông tin quyền hạn</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="pb-2">Tính năng</th>
                <th className="pb-2 text-center">Xem</th>
                <th className="pb-2 text-center">Quản lý</th>
                <th className="pb-2 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Nhập / Xuất kho', true, true, true],
                ['Xem báo cáo', true, true, true],
                ['Sửa sản phẩm', false, true, true],
                ['Xóa sản phẩm', false, false, true],
                ['Quản lý tài khoản', false, false, true],
              ].map(([label, v, m, a], i) => (
                <tr key={i}>
                  <td className="py-2.5 font-medium">{label as string}</td>
                  <td className="text-center">{v ? '✅' : '❌'}</td>
                  <td className="text-center">{m ? '✅' : '❌'}</td>
                  <td className="text-center">{a ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
