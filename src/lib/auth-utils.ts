export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER'

export interface SessionUser {
  id: string
  name: string
  role: Role
  canInbound: boolean
  canOutbound: boolean
  canManageProducts: boolean
  canDeleteProducts: boolean
  canManageUsers: boolean
}

export function canInbound(user: SessionUser): boolean {
  return user.canInbound || user.role === 'ADMIN'
}

export function canOutbound(user: SessionUser): boolean {
  return user.canOutbound || user.role === 'ADMIN'
}

export function canEditProducts(user: SessionUser): boolean {
  return user.canManageProducts || user.role === 'ADMIN'
}

export function canDeleteProducts(user: SessionUser): boolean {
  return user.canDeleteProducts || user.role === 'ADMIN'
}

export function canManageUsers(user: SessionUser): boolean {
  return user.canManageUsers || user.role === 'ADMIN'
}
