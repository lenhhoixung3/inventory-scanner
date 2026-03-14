'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithPin } from '@/lib/auth-actions'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await loginWithPin(pin)
      if (result.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(result.error || 'Sai mã PIN.')
      }
    } catch {
      setError('Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin((p) => p + d)
  }

  const handleDelete = () => setPin((p) => p.slice(0, -1))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-xs bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mt-1">Hệ thống Quản lý Kho</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* PIN display */}
          <div className="flex justify-center items-center gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  i < pin.length
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {i < pin.length && <div className="w-3 h-3 rounded-full bg-white" />}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              <button
                key={i}
                type={d === '' ? 'button' : 'button'}
                onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(d) : null}
                disabled={d === ''}
                className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-90 ${
                  d === '⌫'
                    ? 'bg-red-50 text-red-500'
                    : d === ''
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
