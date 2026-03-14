'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/auth-utils'

export async function createUser(data: { name: string; pin: string; role: string }) {
  const user = await getCurrentUser()
  if (!user || !canManageUsers(user.role)) {
    throw new Error('Chỉ Admin mới có thể tạo tài khoản.')
  }
  const existing = await (prisma as any).user.findFirst({ where: { pin: data.pin } })
  if (existing) throw new Error('Mã PIN này đã được sử dụng.')
  return (prisma as any).user.create({ data })
}

export async function deleteUser(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error('Không có quyền.')
  if (user.id === id) throw new Error('Không thể xóa chính mình.')
  await (prisma as any).user.delete({ where: { id } })
  revalidatePath('/users')
}

export async function createProduct(data: {
  name: string
  barcode: string
  price: number
  unit: string
  stock: number
  allowDuplicate?: boolean
}) {
  // Logic kiểm tra trùng: 
  // Chặn nếu: (SP mới không cho phép trùng) HOẶC (Tìm thấy ít nhất 1 SP cùng mã không cho phép trùng)
  const isDuplicateAllowedForNew = data.allowDuplicate ?? false

  const conflictingProduct = await prisma.product.findFirst({
    where: { 
      barcode: data.barcode,
      OR: [
        { allowDuplicate: false }, // Có sản phẩm cũ không cho trùng
      ]
    }
  })

  if (!isDuplicateAllowedForNew && conflictingProduct) {
    throw new Error('Mã vạch này đã tồn tại và không được phép trùng lặp.')
  }
  
  if (isDuplicateAllowedForNew && conflictingProduct && !conflictingProduct.allowDuplicate) {
    throw new Error(`Sản phẩm '${conflictingProduct.name}' đang dùng mã này và yêu cầu DUY NHẤT. Bạn không thể nhập trùng.`)
  }

  const product = await prisma.product.create({ data: {
    name: data.name,
    barcode: data.barcode,
    price: data.price,
    unit: data.unit,
    stock: data.stock,
    allowDuplicate: isDuplicateAllowedForNew
  }})

  if (data.stock > 0) {
    await prisma.transaction.create({ data: {
      productId: product.id, type: 'IN', quantity: data.stock, note: 'Tồn kho ban đầu'
    }})
  }

  revalidatePath('/')
  revalidatePath('/products')
  return product
}

export async function processTransaction(barcode: string, type: 'IN' | 'OUT', quantity: number, note: string) {
  // Nếu trùng mã, ưu tiên lấy sản phẩm được cập nhật mới nhất
  const product = await prisma.product.findFirst({ 
    where: { barcode },
    orderBy: { updatedAt: 'desc' }
  })
  if (!product) throw new Error('Không tìm thấy sản phẩm với mã vạch này.')
  if (type === 'OUT' && product.stock < quantity) throw new Error(`Kho không đủ hàng. Tồn hiện tại: ${product.stock}`)

  const [, tx] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { stock: type === 'IN' ? { increment: quantity } : { decrement: quantity } } }),
    prisma.transaction.create({ data: { productId: product.id, type, quantity, note } })
  ])

  revalidatePath('/')
  revalidatePath('/products')
  return { product, tx }
}
