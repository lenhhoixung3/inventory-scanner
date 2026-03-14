'use client'

import { useState, useEffect } from 'react'
import { updateSetting, getSettings } from './actions'
import { ShieldAlert, CheckCircle2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
    const [lockDuplicate, setLockDuplicate] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        getSettings().then(s => {
            setLockDuplicate(s.lockDuplicateBarcode)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateSetting('lockDuplicateBarcode', lockDuplicate.toString())
            setMessage('Đã lưu cài đặt thành công!')
            setTimeout(() => setMessage(''), 3000)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Đang tải cài đặt...</div>

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <h1 className="text-lg font-bold text-slate-800">Cài đặt Hệ thống</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-emerald-100 rounded-2xl">
                            <ShieldAlert className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Kiểm soát Barcode</h2>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Tùy chỉnh cách hệ thống xử lý khi phát hiện các mã vạch giống nhau.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Khóa trùng Barcode</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Cảnh báo nếu sản phẩm đã tồn tại</p>
                            </div>
                            <button 
                                onClick={() => setLockDuplicate(!lockDuplicate)}
                                className={`w-14 h-8 rounded-full transition-all relative ${lockDuplicate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${lockDuplicate ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                            <div className="text-amber-600 shrink-0">
                                <ShieldAlert size={18} />
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                {lockDuplicate 
                                    ? "Chế độ AN TOÀN: Bạn không thể tạo 2 sản phẩm có cùng mã vạch. Hệ thống sẽ báo lỗi ngay khi quét trùng."
                                    : "Chế độ LINH HOẠT: Bạn có thể nhập nhiều sản phẩm cùng mã vạch. Phù hợp cho hàng lô hoặc mã chung."}
                            </p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                    {saving ? 'Đang lưu...' : (
                        <>
                            <Save size={18} />
                            Lưu cấu hình
                        </>
                    )}
                </button>

                {message && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 size={18} />
                        {message}
                    </div>
                )}
            </main>
        </div>
    )
}
