export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { Package, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react'

export default async function Home() {
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
    <div className="p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Kho</h1>
        <p className="text-gray-500">Hệ thống quản lý Nhập - Xuất - Tồn</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-between">
          <div className="p-2 bg-blue-100 w-max rounded-xl mb-3">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Tổng sản phẩm</p>
          <p className="text-2xl font-bold text-gray-900">{productsCount}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
          <div className="p-2 bg-emerald-100 w-max rounded-xl mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">Tổng tồn kho</p>
          <p className="text-2xl font-bold text-gray-900">{totalStock._sum.stock || 0}</p>
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
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
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
  )
}
