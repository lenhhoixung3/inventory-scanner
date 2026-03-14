'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import type { Role } from './auth'

/** Đăng nhập bằng PIN */
export async function loginWithPin(pin: string): Promise<{ success: boolean; user?: { id: string; name: string; role: Role }; error?: string }> {
  try {
    const user = await (prisma as any).user.findFirst({ where: { pin } })
    if (!user) return { success: false, error: 'Mã PIN không đúng.' }
    const cookieStore = await cookies()
    cookieStore.set('wms_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 7 })
    return { success: true, user: { id: user.id, name: user.name, role: user.role as Role } }
  } catch {
    return { success: false, error: 'Lỗi kết nối server.' }
  }
}

/** Đăng xuất */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('wms_user_id')
}
