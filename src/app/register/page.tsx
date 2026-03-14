'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/auth-actions'
import Link from 'next/link'
import { UserPlus, Mail, Phone, User, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await register(formData)
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Đã xảy ra lỗi.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h1>
          <p className="text-slate-600 mb-6">
            Yêu cầu của bạn đã được gửi tới Quản trị viên. 
            Vui lòng chờ email xác nhận và mật khẩu trước khi đăng nhập.
          </p>
          <Link 
            href="/login"
            className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký thành viên</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                required
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                required
                type="email"
                placeholder="email@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                required
                type="tel"
                placeholder="09xx xxx xxx"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu gia nhập'}
          </button>

          <p className="text-center text-slate-500 text-sm mt-4">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
