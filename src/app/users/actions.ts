'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/auth-utils'

export async function deleteUser(id: string) {
  const user = await getCurrentUser()
  if (!user || !canManageUsers(user)) throw new Error('Không có quyền.')
  if (user.id === id) throw new Error('Không thể xóa chính mình.')
  await (prisma as any).user.delete({ where: { id } })
  revalidatePath('/users')
}
export async function updateUserPermissions(id: string, data: {
  canInbound?: boolean
  canOutbound?: boolean
  canManageProducts?: boolean
  canDeleteProducts?: boolean
  canManageUsers?: boolean
}) {
  const user = await getCurrentUser()
  if (!user || !canManageUsers(user)) throw new Error('Không có quyền.')
  
  await (prisma as any).user.update({
    where: { id },
    data
  })
  revalidatePath('/users')
}
