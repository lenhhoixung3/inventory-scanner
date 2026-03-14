'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { canEditProducts } from '@/lib/auth-utils'

export async function updateProduct(id: string, data: {
  name: string
  barcode: string
  price: number
  unit: string
}) {
  const user = await getCurrentUser()
  if (!user || !canEditProducts(user.role)) {
    throw new Error('Bạn không có quyền chỉnh sửa sản phẩm.')
  }

  // Kiểm tra cài đặt khóa trùng barcode
  const lockSetting = await prisma.systemSetting.findUnique({ where: { key: 'lockDuplicateBarcode' } })
  const isLocked = lockSetting?.value === 'true'

  if (isLocked) {
    const existing = await prisma.product.findFirst({
        where: { barcode: data.barcode, NOT: { id } }
    })
    if (existing) {
        throw new Error('Mã vạch này đã được dùng cho sản phẩm khác. (Chế độ KHÓA TRÙNG đang bật)')
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      barcode: data.barcode,
      price: data.price,
      unit: data.unit,
    }
  })

  revalidatePath('/products')
  revalidatePath('/')
  return product
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Chỉ Admin mới có thể xóa sản phẩm.')
  }

  await prisma.product.delete({ where: { id } })
  revalidatePath('/products')
  revalidatePath('/')
}
