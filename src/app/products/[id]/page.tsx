import prisma from '@/lib/prisma'
import { getCurrentUser, ensureDefaultAdmin } from '@/lib/auth'
import { canEditProducts } from '@/lib/auth-utils'
import { notFound, redirect } from 'next/navigation'
import EditProductClient from './EditProductClient'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureDefaultAdmin()
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (!canEditProducts(user.role)) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
        <p className="text-gray-500 text-sm">Tài khoản của bạn (<strong>{user.role}</strong>) không được phép chỉnh sửa sản phẩm.</p>
        <p className="text-gray-400 text-xs mt-2">Liên hệ Admin để được cấp quyền.</p>
      </div>
    )
  }

  const { id } = await params
  const product = await (prisma as any).product.findUnique({ where: { id } })
  if (!product) notFound()

  return <EditProductClient product={product} currentRole={user.role} />
}
