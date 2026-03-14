import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Package, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react'

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const productsCount = await prisma.product.count()
  const totalStock = await prisma.product.aggregate({
    _sum: {
      stock: true
    }
  })

  const recentTransactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { product: true }
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="p-6 bg-blue-600 text-white rounded-b-[3rem] shadow-lg mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Xin chào, {user.name}!</h1>
            <p className="text-blue-100 text-sm opacity-80">Hệ thống quản lý kho PRO</p>
          </div>
          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
             <span className="text-[10px] font-bold uppercase tracking-wider">{user.role}</span>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-blue-50 w-max rounded-xl mb-3">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-gray-900">{productsCount}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="p-2 bg-emerald-50 w-max rounded-xl mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">Tổng tồn kho</p>
            <p className="text-xl font-bold text-gray-900">{totalStock._sum.stock || 0}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Chưa có giao dịch nào.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'IN' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.type === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{tx.product.name}</h3>
                      <p className="text-[10px] text-gray-400">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'IN' ? 'text-blue-600' : 'text-rose-600'}`}>
                      {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
