'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { Role } from './auth'

import { ensureDefaultAdmin } from './auth'

/** Đăng nhập */
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Đảm bảo có tài khoản Admin mặc định trước khi kiểm tra đăng nhập
    await ensureDefaultAdmin()

    const user = await (prisma as any).user.findUnique({ where: { email } })
    if (!user) return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }
    
    if (user.status === 'PENDING') {
      return { success: false, error: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt.' }
    }

    if (user.password !== password) {
       return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('wms_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 7 })
    return { success: true }
  } catch (e: any) {
    console.error('Login error:', e)
    return { success: false, error: `Lỗi kết nối server: ${e.message || 'Unknown error'}` }
  }
}

/** Đăng ký tài khoản mới (Chờ duyệt) */
export async function register(data: { name: string; email: string; phone: string }) {
  try {
    const existing = await (prisma as any).user.findUnique({ where: { email: data.email } })
    if (existing) return { success: false, error: 'Email này đã tồn tại.' }

    await (prisma as any).user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'VIEWER',
        status: 'PENDING'
      }
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Lỗi đăng ký.' }
  }
}

/** Phê duyệt và cấp mật khẩu */
export async function approveUser(id: string, password: string) {
  try {
    await (prisma as any).user.update({
      where: { id },
      data: {
        password: password,
        status: 'APPROVED'
      }
    })
    revalidatePath('/users')
    return { success: true }
  } catch {
    return { success: false, error: 'Lỗi khi duyệt tài khoản.' }
  }
}

/** Đăng xuất */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('wms_user_id')
}
