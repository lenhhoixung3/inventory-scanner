'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct, deleteProduct } from './actions'
import { canDeleteProducts, Role } from '@/lib/auth-utils'

interface Product {
  id: string
  name: string
  barcode: string
  price: number
  unit: string
  stock: number
  allowDuplicate: boolean
}

export default function EditProductClient({ product, currentRole }: { product: Product, currentRole: Role }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: product.name,
    barcode: product.barcode,
    price: String(product.price),
    unit: product.unit,
    allowDuplicate: product.allowDuplicate
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateProduct(product.id, {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        price: parseFloat(form.price) || 0,
        unit: form.unit.trim(),
        allowDuplicate: form.allowDuplicate
      })
      setSuccess('Đã lưu thành công!')
      setTimeout(() => router.push('/products'), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      router.push('/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-gray-100 active:scale-90 transition-all">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã vạch *</label>
          <input
            type="text"
            required
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
           <input 
              type="checkbox"
              id="allowDuplicate"
              className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={form.allowDuplicate}
              onChange={e => setForm({...form, allowDuplicate: e.target.checked})}
           />
           <label htmlFor="allowDuplicate" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Cho phép trùng mã vạch
           </label>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
          📦 Tồn kho hiện tại: <strong>{product.stock} {product.unit}</strong> — Không thể chỉnh sửa tại đây. Hãy dùng Nhập/Xuất kho.
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm">{success}</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
      </form>

      {/* Xóa sản phẩm (ADMIN only) */}
      {canDeleteProducts(currentRole) && (
        <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Vùng nguy hiểm</p>
            {!showDeleteConfirm ? (
            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm active:scale-90 transition-all"
            >
                🗑 Xóa sản phẩm
            </button>
            ) : (
            <div className="p-4 bg-red-50 rounded-xl space-y-3">
                <p className="text-red-700 text-sm font-semibold">Bạn chắc chắn muốn xóa sản phẩm này?</p>
                <p className="text-red-500 text-xs">Hành động này không thể hoàn tác. Tất cả lịch sử giao dịch cũng sẽ bị xóa.</p>
                <div className="flex gap-2">
                <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm"
                >
                    Hủy
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                    {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
                </div>
            </div>
            )}
        </div>
      )}
    </div>
  )
}
