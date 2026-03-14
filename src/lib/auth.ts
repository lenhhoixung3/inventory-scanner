import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER'
export type UserStatus = 'PENDING' | 'APPROVED'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
}

/** Lấy thông tin người dùng hiện tại từ cookie session */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('wms_user_id')?.value
  if (!userId) return null
  try {
    const user = await (prisma as any).user.findUnique({ where: { id: userId } })
    if (!user || user.status !== 'APPROVED') return null
    return { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role as Role,
      status: user.status as UserStatus
    }
  } catch {
    return null
  }
}

/** Khởi tạo tài khoản ADMIN mặc định nếu chưa có ai */
export async function ensureDefaultAdmin() {
  try {
    const count = await (prisma as any).user.count()
    if (count === 0) {
      // Mật khẩu mặc định: admin123 (Sẽ được hash trong thực tế)
      // Cho bản demo này tôi sẽ để plain text hoặc hash đơn giản
      await (prisma as any).user.create({
        data: { 
          name: 'Admin', 
          email: 'admin@wms.com',
          password: 'admin123', // Admin đầu tiên khởi tạo bằng tay hoặc env
          role: 'ADMIN',
          status: 'APPROVED'
        }
      })
    }
  } catch {}
}
