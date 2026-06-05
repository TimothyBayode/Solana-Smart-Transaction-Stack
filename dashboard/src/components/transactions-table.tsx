'use client'

import React from 'react'
import { Transaction } from '@/lib/api'

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Signature</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-right py-3 px-4">Slot</th>
            <th className="text-right py-3 px-4">Tip</th>
            <th className="text-right py-3 px-4">Submitted</th>
            <th className="text-right py-3 px-4">Processed</th>
            <th className="text-right py-3 px-4">Confirmed</th>
            <th className="text-right py-3 px-4">Finalized</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.signature} className="border-t border-[#1f1f2a] hover:bg-[#1f1f2a]/50">
              <td className="py-3 px-4 font-mono text-xs">
                {tx.signature.substring(0, 16)}...
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  tx.status === 'finalized' ? 'bg-[#14F195]/10 text-[#14F195]' :
                  tx.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' :
                  tx.status === 'processed' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {tx.status}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono text-xs">{tx.submittedSlot}</td>
              <td className="py-3 px-4 text-right font-mono text-xs">{tx.tip}</td>
              <td className="py-3 px-4 text-right text-xs">
                {new Date(tx.submittedAt).toLocaleTimeString()}
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {tx.processedAt ? `${(tx.processedDeltaMs / 1000).toFixed(1)}s` : '-'}
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {tx.confirmedAt ? `${(tx.confirmedDeltaMs / 1000).toFixed(1)}s` : '-'}
              </td>
              <td className="py-3 px-4 text-right text-xs">
                {tx.finalizedAt ? `${(tx.finalizedDeltaMs / 1000).toFixed(1)}s` : '-'}
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-[#6b7280]">
                No transactions recorded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
