'use client'

import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/utils'

interface InsightsResponse {
  topPaying: { company: string; avg: number }[]
  locationBreakdown: { location: string; avg: number; count: number }[]
  roleBreakdown: { role: string; avg: number; count: number }[]
  insights: string[]
  totalEntries: number
  totalCompanies: number
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights').then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="page-container py-10">
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 32 }} />
        <div className="grid grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}</div>
      </div>
    )
  }
  if (!data) return null

  const maxC = data.topPaying[0]?.avg || 1
  const maxL = data.locationBreakdown[0]?.avg || 1
  const maxR = data.roleBreakdown[0]?.avg || 1

  return (
    <div className="page-container py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Insights</h1>
        <p className="text-sm text-dim">{data.totalEntries} entries · {data.totalCompanies} companies</p>
      </div>

      {/* Key findings */}
      <div className="card card-padded mb-8">
        <div className="section-title">Key Findings</div>
        <div className="space-y-2">
          {data.insights.map((text, i) => (
            <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < data.insights.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span className="text-accent mono text-xs font-bold mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-sm text-mid leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top companies */}
        <div className="card card-padded">
          <div className="section-title">Top Paying Companies</div>
          <div className="space-y-3">
            {data.topPaying.map((item, i) => (
              <div key={item.company}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    <span className="text-dim mono text-xs mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {item.company}
                  </span>
                  <span className="text-sm font-semibold mono text-accent">{formatINR(item.avg)}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.avg / maxC) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* By Location */}
        <div className="card card-padded">
          <div className="section-title">By Location</div>
          <div className="space-y-3">
            {data.locationBreakdown.map((item) => (
              <div key={item.location}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.location} <span className="text-dim text-xs">({item.count})</span></span>
                  <span className="text-sm font-semibold mono text-accent">{formatINR(item.avg)}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.avg / maxL) * 100}%`, background: '#22c55e' }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* By Role */}
        <div className="card card-padded col-span-2">
          <div className="section-title">By Role</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {data.roleBreakdown.map((item) => (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.role} <span className="text-dim text-xs">({item.count})</span></span>
                  <span className="text-sm font-semibold mono text-accent">{formatINR(item.avg)}</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.avg / maxR) * 100}%`, background: '#f59e0b' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
