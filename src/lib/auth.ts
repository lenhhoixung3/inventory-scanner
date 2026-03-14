import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER'

export interface SessionUser {
  id: string
  name: string
  role: Role
}

/** Lấy thông tin người dùng hiện tại từ cookie session */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('wms_user_id')?.value
  if (!userId) return null
  try {
    const user = await (prisma as any).user.findUnique({ where: { id: userId } })
    if (!user) return null
    return { id: user.id, name: user.name, role: user.role as Role }
  } catch {
    return null
  }
}

/** Khởi tạo tài khoản ADMIN mặc định nếu chưa có ai */
export async function ensureDefaultAdmin() {
  try {
    const count = await (prisma as any).user.count()
    if (count === 0) {
      await (prisma as any).user.create({
        data: { name: 'Admin', pin: '1234', role: 'ADMIN' }
      })
    }
  } catch {}
}
