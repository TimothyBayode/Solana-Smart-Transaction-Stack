'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout'
import { FailuresTable } from '@/components/failures-table'
import { api, Failure } from '@/lib/api'

export default function FailuresPage() {
  const [failures, setFailures] = useState<Failure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getFailures()
        setFailures(data)
      } catch (error) {
        console.error('Failed to load failures', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const recoveryRate = failures.length > 0
    ? ((failures.filter((f) => f.recovered).length / failures.length) * 100).toFixed(1)
    : '0.0'

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Failures</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          {failures.length} total - {recoveryRate}% recovery rate
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#9945FF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <FailuresTable failures={failures} />
        </div>
      )}
    </Layout>
  )
}
