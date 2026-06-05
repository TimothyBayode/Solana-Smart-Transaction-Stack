'use client'

import React, { useEffect, useState } from 'react'
import { Layout } from '@/components/layout'
import { BundlesTable } from '@/components/bundles-table'
import { api, Bundle } from '@/lib/api'

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBundles()
        setBundles(data)
      } catch (error) {
        console.error('Failed to load bundles', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const landedRate = bundles.length > 0
    ? ((bundles.filter((b) => b.landed).length / bundles.length) * 100).toFixed(1)
    : '0.0'

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Bundles</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          {bundles.length} total - {landedRate}% landing rate
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#9945FF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <BundlesTable bundles={bundles} />
        </div>
      )}
    </Layout>
  )
}
