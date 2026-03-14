export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { getCurrentUser, ensureDefaultAdmin } from '@/lib/auth'
import { canEditProducts } from '@/lib/auth-utils'

export default async function ProductsPage() {
  await ensureDefaultAdmin()
  const [products, user] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    getCurrentUser(),
  ])

  const canEdit = user && canEditProducts(user.role)

  return (
    <div className="p-4 space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-sm text-gray-500">{products.length} mặt hàng</p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
              {user.role === 'ADMIN' ? '👑' : user.role === 'MANAGER' ? '🔧' : '👁'} {user.name}
            </span>
          ) : (
            <Link href="/login" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              Đăng nhập
            </Link>
          )}
          {canEdit && (
            <Link
              href="/products/new"
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </Link>
          )}
        </div>
      </header>

      {!user && (
        <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          🔒 <span>Đăng nhập để chỉnh sửa sản phẩm</span>
          <Link href="/login" className="ml-auto underline font-semibold">Đăng nhập</Link>
        </div>
      )}

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500">Chưa có sản phẩm nào.</p>
          </div>
        ) : (
          products.map((prod: any) => (
            <div key={prod.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{prod.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">Mã: {prod.barcode}</p>
              </div>
              <div className="text-right ml-3 flex items-center gap-2">
                <div>
                  <p className="text-lg font-bold text-blue-600">{prod.stock} <span className="text-sm font-medium text-gray-500">{prod.unit}</span></p>
                  <p className="text-xs text-gray-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}</p>
                </div>
                {canEdit && (
                  <Link
                    href={`/products/${prod.id}`}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-blue-100 active:scale-90 transition-all text-gray-600 hover:text-blue-600"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
