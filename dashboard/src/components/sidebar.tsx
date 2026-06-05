'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/failures', label: 'Failures' },
  { href: '/decisions', label: 'AI Decisions' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-[#1f1f2a] p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-lg font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
          Smart TX Stack
        </h1>
        <p className="text-xs text-[#6b7280] mt-1">Transaction Infrastructure</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#9945FF]/10 text-[#9945FF] border border-[#9945FF]/20'
                  : 'text-[#6b7280] hover:text-white hover:bg-[#1f1f2a]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-[#1f1f2a]">
        <p className="text-xs text-[#6b7280]">v1.0.0</p>
      </div>
    </aside>
  )
}
