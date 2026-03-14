'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ScanBarcode, Loader2 } from 'lucide-react'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { createProduct } from './actions'

export default function NewProductPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    unit: 'cái',
    stock: '0',
    allowDuplicate: false
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await createProduct({
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        allowDuplicate: formData.allowDuplicate
      })
      router.push('/products')
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi lưu sản phẩm")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center px-4 h-14 bg-white border-b border-gray-200">
        <Link href="/products" className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="ml-2 font-semibold text-gray-900">Thêm sản phẩm mới</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Tên sản phẩm */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Tên sản phẩm *</label>
          <input 
            required 
            type="text" 
            className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="VD: Nước giải khát Coca Cola"
            value={formData.name}
            onChange={e => setFormData(f => ({...f, name: e.target.value}))}
          />
        </div>

        {/* Mã vạch */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Mã vạch (Barcode) *</label>
          <div className="flex gap-2">
            <input 
              required 
              type="text" 
              className="flex-1 px-4 py-3 text-sm font-mono bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Nhập mã hoặc quét camera"
              value={formData.barcode}
              onChange={e => setFormData(f => ({...f, barcode: e.target.value}))}
            />
            <button 
              type="button"
              onClick={() => setIsScanning(true)}
              className="flex items-center justify-center p-3 text-blue-600 bg-blue-50 rounded-xl border border-blue-100 active:scale-95 transition-all"
            >
              <ScanBarcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Giá + Đơn vị */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Giá bán (VNĐ)</label>
            <input 
              type="number" 
              min="0"
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
              placeholder="0"
              value={formData.price}
              onChange={e => setFormData(f => ({...f, price: e.target.value}))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Đơn vị tính</label>
            <select 
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none"
              value={formData.unit}
              onChange={e => setFormData(f => ({...f, unit: e.target.value}))}
            >
              <option>cái</option>
              <option>hộp</option>
              <option>thùng</option>
              <option>kg</option>
              <option>chai</option>
            </select>
          </div>
        </div>

        {/* Tồn kho đầu kỳ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Tồn kho ban đầu</label>
            <input 
              type="number" 
              min="0"
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
              placeholder="0"
              value={formData.stock}
              onChange={e => setFormData(f => ({...f, stock: e.target.value}))}
            />
          </div>
          <div className="flex flex-col justify-end pb-1">
             <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.allowDuplicate}
                  onChange={e => setFormData(f => ({...f, allowDuplicate: e.target.checked}))}
                />
                <span className="text-sm font-medium text-gray-700">Cho phép trùng mã</span>
             </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center justify-center w-full py-3.5 mt-8 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu Sản Phẩm"}
        </button>
      </form>

      {isScanning && (
        <BarcodeScanner 
          onScan={(code) => {
            setFormData(f => ({...f, barcode: code}))
            setIsScanning(false)
          }}
          onClose={() => setIsScanning(false)}
        />
      )}
    </div>
  )
}
