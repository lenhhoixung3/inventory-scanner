'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ScanBarcode, Loader2, ArrowUpRight } from 'lucide-react'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { processTransaction } from '@/app/products/new/actions'

export default function OutboundPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [formData, setFormData] = useState({
    barcode: '',
    quantity: '1',
    note: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      const res = await processTransaction(
        formData.barcode, 
        'OUT', 
        Number(formData.quantity), 
        formData.note
      )
      setSuccessMsg(`Đã xuất thành công ${formData.quantity} [${res.product.name}]. Tồn mới: ${res.product.stock - Number(formData.quantity)}`)
      setFormData(f => ({...f, barcode: '', quantity: '1', note: ''}))
      router.refresh()
    } catch (error: any) {
      setErrorMsg(error.message || "Có lỗi xảy ra")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center px-4 h-14 bg-rose-600 text-white shadow-sm">
        <Link href="/" className="p-2 -ml-2 text-rose-100 active:bg-rose-700 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="ml-2 font-semibold">Xuất Kho (Outbound)</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="flex justify-center py-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
          <div className="text-center">
            <div className="p-4 mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-full mb-3 flex items-center justify-center">
              <ArrowUpRight className="w-8 h-8" />
            </div>
            <p className="font-medium text-gray-900">Quét mã để xuất kho</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 text-sm font-medium text-emerald-800 bg-emerald-100 rounded-xl">
            {successMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="p-4 text-sm font-medium text-rose-800 bg-rose-100 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Mã vạch</label>
            <div className="flex gap-2">
              <input 
                required 
                type="text" 
                className="flex-1 px-4 py-3 text-sm font-mono bg-white border border-gray-200 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                placeholder="Nhập mã hoặc quét"
                value={formData.barcode}
                onChange={e => setFormData(f => ({...f, barcode: e.target.value}))}
              />
              <button 
                type="button"
                onClick={() => setIsScanning(true)}
                className="flex items-center justify-center p-3 text-rose-600 bg-rose-50 rounded-xl border border-rose-100 active:scale-95 transition-all"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Số lượng xuất</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full px-4 py-3 text-sm font-bold bg-white border border-gray-200 rounded-xl focus:border-rose-500 outline-none"
                value={formData.quantity}
                onChange={e => setFormData(f => ({...f, quantity: e.target.value}))}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Lý do xuất (Tùy chọn)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-rose-500 outline-none"
              placeholder="Xuất bán, trả lại..."
              value={formData.note}
              onChange={e => setFormData(f => ({...f, note: e.target.value}))}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !formData.barcode}
            className="flex items-center justify-center w-full py-3.5 mt-8 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận Xuất Kho"}
          </button>
        </form>
      </div>

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
