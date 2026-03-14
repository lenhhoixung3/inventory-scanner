export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { getCurrentUser, ensureDefaultAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersPageClient from './UsersPageClient'

export default async function UsersPage() {
  await ensureDefaultAdmin()
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
        <p className="text-gray-500 text-sm">Chỉ Admin mới có thể quản lý phân quyền.</p>
      </div>
    )
  }
  const users = await (prisma as any).user.findMany({ orderBy: { createdAt: 'asc' } })
  return <UsersPageClient users={users as any} currentUserId={user.id} />
}
