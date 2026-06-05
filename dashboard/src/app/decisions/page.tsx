'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout'
import { DecisionsTable } from '@/components/decisions-table'
import { api, Decision } from '@/lib/api'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDecisions()
        setDecisions(data)
      } catch (error) {
        console.error('Failed to load decisions', error)
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
        <h2 className="text-2xl font-bold">AI Decisions</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          {decisions.length} total decisions made by the AI agent
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#9945FF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <DecisionsTable decisions={decisions} />
        </div>
      )}
    </Layout>
  )
}
