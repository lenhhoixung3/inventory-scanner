'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { canEditProducts, canDeleteProducts, canInbound, canOutbound } from '@/lib/auth-utils'

export async function updateProduct(id: string, data: {
  name: string
  barcode: string
  price: number
  unit: string
  allowDuplicate?: boolean
}) {
  const user = await getCurrentUser()
  if (!user || !canEditProducts(user)) {
    throw new Error('Bạn không có quyền chỉnh sửa sản phẩm.')
  }

  const isDuplicateAllowedForNew = data.allowDuplicate ?? false

  const conflictingProduct = await (prisma as any).product.findFirst({
    where: { 
      barcode: data.barcode,
      NOT: { id },
      allowDuplicate: false
    }
  })

  if (conflictingProduct) {
     throw new Error(`Mã vạch bị trùng với sản phẩm '${conflictingProduct.name}' (yêu cầu Duy nhất).`)
  }

  if (!isDuplicateAllowedForNew) {
      const anyExisting = await prisma.product.findFirst({ where: { barcode: data.barcode, NOT: { id } } })
      if (anyExisting) throw new Error('Có sản phẩm khác đang dùng mã này. Bạn không thể thiết lập "Duy nhất" cho sản phẩm này.')
  }

  const product = await (prisma as any).product.update({
    where: { id },
    data: {
      name: data.name,
      barcode: data.barcode,
      price: data.price,
      unit: data.unit,
      allowDuplicate: isDuplicateAllowedForNew
    }
  })

  revalidatePath('/products')
  revalidatePath('/')
  return product
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user || !canDeleteProducts(user)) {
    throw new Error('Bạn không có quyền xóa sản phẩm.')
  }

  await prisma.product.delete({ where: { id } })
  revalidatePath('/products')
  revalidatePath('/')
}
