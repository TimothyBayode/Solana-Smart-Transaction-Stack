'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout'
import { TransactionsTable } from '@/components/transactions-table'
import { api, Transaction } from '@/lib/api'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTransactions()
        setTransactions(data)
      } catch (error) {
        console.error('Failed to load transactions', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          Transaction lifecycle tracking - {transactions.length} total
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#9945FF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <TransactionsTable transactions={transactions} />
        </div>
      )}
    </Layout>
  )
}
