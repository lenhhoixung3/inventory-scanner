'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth-actions'
import Link from 'next/link'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await login(formData.email, formData.password)
    if (res.success) {
      router.push('/products')
      router.refresh()
    } else {
      setError(res.error || 'Email hoặc mật khẩu không đúng.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-lg">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">WMS Login</h1>
          <p className="text-slate-500 text-sm">Hệ thống Quản lý Kho Thông Minh</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                required
                type="email"
                placeholder="admin@wms.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>

          <div className="flex flex-col space-y-3 mt-6">
            <p className="text-center text-slate-500 text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <div className="text-center">
              <span className="text-xs text-slate-400 italic">Mặc định: admin@wms.com / admin123</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
