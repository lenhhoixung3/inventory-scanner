'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

export async function getSettings() {
  const settings = await prisma.systemSetting.findMany()
  return {
    lockDuplicateBarcode: settings.find(s => s.key === 'lockDuplicateBarcode')?.value === 'true'
  }
}

export async function updateSetting(key: string, value: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error('Chỉ Admin mới có quyền cài đặt.')

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })

  revalidatePath('/settings')
  return { success: true }
}
