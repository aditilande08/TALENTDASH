'use client'

import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/utils'

interface LevelRow {
  normalizedLevel: number
  seniorityLabel: string
  companies: { name: string; companyLevel: string; title: string }[]
}

interface LevelsData {
  levels: LevelRow[]
  companyNames: string[]
  compensation: Record<string, Record<number, number>>
}

export default function LevelsPage() {
  const [data, setData] = useState<LevelsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/levels').then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="page-container py-10">
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="page-container py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Level Mapping</h1>
        <p className="text-sm text-dim">
          How engineering levels compare across {data.companyNames.length} companies.
          Same row = equivalent seniority.
        </p>
      </div>

      <div className="text-xs text-dim mb-6" style={{ maxWidth: 600 }}>
        Every company uses different level names. Google calls it L3, Microsoft calls it 59, Amazon calls it L4 —
        but they all mean the same thing: entry-level software engineer. This table maps them so you can compare apples to apples.
      </div>

      {/* Level mapping table */}
      <div className="card overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Level</th>
                <th style={{ width: 80 }}>Seniority</th>
                {data.companyNames.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.levels.map((level) => (
                <tr key={level.normalizedLevel}>
                  <td className="text-foreground font-bold mono">{level.normalizedLevel}</td>
                  <td>
                    <span className={`tag ${
                      level.seniorityLabel === 'Junior' ? 'tag-blue' :
                      level.seniorityLabel === 'Mid' ? 'tag-neutral' :
                      level.seniorityLabel === 'Senior' ? 'tag-green' :
                      level.seniorityLabel === 'Staff' ? 'tag-amber' :
                      'tag-red'
                    }`}>
                      {level.seniorityLabel}
                    </span>
                  </td>
                  {data.companyNames.map((companyName) => {
                    const match = level.companies.find((c) => c.name === companyName)
                    return (
                      <td key={companyName}>
                        {match ? (
                          <div>
                            <div className="text-foreground font-medium text-xs">{match.companyLevel}</div>
                            <div className="text-dim text-xs">{match.title}</div>
                          </div>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compensation by level */}
      <div className="mb-2">
        <h2 className="text-lg font-bold tracking-tight mb-1">Compensation by Level</h2>
        <p className="text-sm text-dim">Average total CTC at each equivalent level, per company</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Seniority</th>
                {data.companyNames.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.levels.map((level) => (
                <tr key={level.normalizedLevel}>
                  <td className="text-foreground font-bold mono">{level.normalizedLevel}</td>
                  <td className="text-mid text-xs">{level.seniorityLabel}</td>
                  {data.companyNames.map((companyName) => {
                    const comp = data.compensation[companyName]?.[level.normalizedLevel]
                    return (
                      <td key={companyName} className="mono text-sm">
                        {comp ? (
                          <span className="text-accent font-semibold">{formatINR(comp)}</span>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
