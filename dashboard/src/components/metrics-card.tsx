'use client'

import React from 'react'

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: boolean
}

export function MetricsCard({ title, value, subtitle, accent }: MetricsCardProps) {
  return (
    <div className="card">
      <p className="text-sm text-[#6b7280] mb-2">{title}</p>
      <p className={`metric-value ${accent ? 'text-[#14F195]' : 'text-white'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-[#6b7280] mt-1">{subtitle}</p>
      )}
    </div>
  )
}
