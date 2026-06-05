'use client'

import React from 'react'
import { Failure } from '@/lib/api'

interface FailuresTableProps {
  failures: Failure[]
}

export function FailuresTable({ failures }: FailuresTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Signature</th>
            <th className="text-left py-3 px-4">Failure Type</th>
            <th className="text-left py-3 px-4">Reason</th>
            <th className="text-left py-3 px-4">Recovered</th>
            <th className="text-right py-3 px-4">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((f) => (
            <tr key={f.id} className="border-t border-[#1f1f2a] hover:bg-[#1f1f2a]/50">
              <td className="py-3 px-4 font-mono text-xs">
                {f.signature.substring(0, 16)}...
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400">
                  {f.failureType}
                </span>
              </td>
              <td className="py-3 px-4 text-xs text-[#6b7280] max-w-xs truncate">
                {f.reason}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  f.recovered
                    ? 'bg-[#14F195]/10 text-[#14F195]'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {f.recovered ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {new Date(f.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
          {failures.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-[#6b7280]">
                No failures recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
