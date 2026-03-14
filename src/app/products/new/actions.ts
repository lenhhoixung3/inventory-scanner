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
}) {
  const existing = await prisma.product.findUnique({ where: { barcode: data.barcode } })
  if (existing) throw new Error('Sản phẩm với mã vạch này đã tồn tại!')

  const product = await prisma.product.create({ data: {
    name: data.name,
    barcode: data.barcode,
    price: data.price,
    unit: data.unit,
    stock: data.stock,
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
  const product = await prisma.product.findUnique({ where: { barcode } })
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
