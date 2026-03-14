'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { name: 'Tổng quan', href: '/', icon: Home },
  { name: 'Nhập kho', href: '/inbound', icon: ArrowDownLeft },
  { name: 'Xuất kho', href: '/outbound', icon: ArrowUpRight },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Quyền', href: '/users', icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "inline-flex flex-col items-center justify-center px-1 md:px-5 hover:bg-gray-50",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] md:text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
