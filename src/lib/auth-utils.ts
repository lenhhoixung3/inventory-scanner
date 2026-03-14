export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER'

export interface SessionUser {
  id: string
  name: string
  role: Role
}

export function canEditProducts(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function canDeleteProducts(role: Role): boolean {
  return role === 'ADMIN' // Chỉ Admin mới có thể xóa sản phẩm
}

export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN' // Chỉ Admin mới được quyền quản lý User (Duyệt/Xóa)
}
