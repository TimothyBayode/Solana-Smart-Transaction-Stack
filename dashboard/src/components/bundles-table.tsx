'use client'

import React from 'react'
import { Bundle } from '@/lib/api'

interface BundlesTableProps {
  bundles: Bundle[]
}

export function BundlesTable({ bundles }: BundlesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Bundle ID</th>
            <th className="text-right py-3 px-4">Slot</th>
            <th className="text-right py-3 px-4">Tip</th>
            <th className="text-left py-3 px-4">Landed</th>
            <th className="text-right py-3 px-4">Landed Slot</th>
            <th className="text-right py-3 px-4">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((b) => (
            <tr key={b.id} className="border-t border-[#1f1f2a] hover:bg-[#1f1f2a]/50">
              <td className="py-3 px-4 font-mono text-xs">
                {b.bundleId.substring(0, 20)}...
              </td>
              <td className="py-3 px-4 text-right font-mono text-xs">{b.slot}</td>
              <td className="py-3 px-4 text-right font-mono text-xs">{b.tip}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  b.landed
                    ? 'bg-[#14F195]/10 text-[#14F195]'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {b.landed ? 'Yes' : 'Pending'}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-xs">
                {b.landedSlot || '-'}
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {new Date(b.submittedAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
          {bundles.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-[#6b7280]">
                No bundles submitted yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
