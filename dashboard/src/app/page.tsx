'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout'
import { MetricsCard } from '@/components/metrics-card'
import { api, Metrics, Transaction, Failure, Decision, Bundle } from '@/lib/api'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to load metrics', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-[#6b7280] mt-1">Real-time transaction infrastructure overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#9945FF] border-t-transparent rounded-full" />
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricsCard
              title="Success Rate"
              value={`${(metrics.successRate * 100).toFixed(1)}%`}
              accent={metrics.successRate > 0.7}
            />
            <MetricsCard
              title="Total Transactions"
              value={metrics.totalTransactions}
            />
            <MetricsCard
              title="Total Failures"
              value={metrics.totalFailures}
              subtitle={`${((metrics.totalFailures / Math.max(metrics.totalTransactions, 1)) * 100).toFixed(1)}% failure rate`}
            />
            <MetricsCard
              title="Current Slot"
              value={metrics.currentSlot}
              subtitle={`Health: ${metrics.health}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <MetricsCard
              title="Avg Confirmation Latency"
              value={`${(metrics.averageConfirmationLatencyMs / 1000).toFixed(2)}s`}
            />
            <MetricsCard
              title="Avg Finalization Latency"
              value={`${(metrics.averageFinalizationLatencyMs / 1000).toFixed(2)}s`}
            />
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-[#6b7280]">Unable to load dashboard metrics. Ensure the backend is running.</p>
        </div>
      )}
    </Layout>
  )
}
