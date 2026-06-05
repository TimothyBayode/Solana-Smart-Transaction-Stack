'use client'

import React from 'react'
import { Decision } from '@/lib/api'

interface DecisionsTableProps {
  decisions: Decision[]
}

export function DecisionsTable({ decisions }: DecisionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Decision</th>
            <th className="text-left py-3 px-4">Reasoning</th>
            <th className="text-right py-3 px-4">Confidence</th>
            <th className="text-right py-3 px-4">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => (
            <tr key={d.id} className="border-t border-[#1f1f2a] hover:bg-[#1f1f2a]/50">
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  d.decision === 'SUBMIT' ? 'bg-[#14F195]/10 text-[#14F195]' :
                  d.decision === 'RETRY' ? 'bg-yellow-500/10 text-yellow-400' :
                  d.decision === 'WAIT' ? 'bg-blue-500/10 text-blue-400' :
                  d.decision === 'INCREASE_TIP' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {d.decision}
                </span>
              </td>
              <td className="py-3 px-4 text-xs text-[#6b7280] max-w-md truncate">
                {d.reasoning}
              </td>
              <td className="py-3 px-4 text-right font-mono text-xs">
                {(d.confidence * 100).toFixed(0)}%
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {new Date(d.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
          {decisions.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[#6b7280]">
                No AI decisions recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
