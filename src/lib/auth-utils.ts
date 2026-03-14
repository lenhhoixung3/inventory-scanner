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
  return role === 'ADMIN'
}

export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN'
}
