import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const mappings = await prisma.levelMapping.findMany({
    include: { company: { select: { id: true, name: true } } },
    orderBy: [{ normalizedLevel: 'asc' }, { company: { name: 'asc' } }],
  })

  // Group by normalized level
  const grouped = new Map<number, { normalizedLevel: number; seniorityLabel: string; companies: { name: string; companyLevel: string; title: string }[] }>()
  for (const m of mappings) {
    const entry = grouped.get(m.normalizedLevel) || { normalizedLevel: m.normalizedLevel, seniorityLabel: m.seniorityLabel, companies: [] }
    entry.companies.push({ name: m.company.name, companyLevel: m.companyLevel, title: m.title })
    grouped.set(m.normalizedLevel, entry)
  }

  // Also get avg comp per company per normalized level
  const salaries = await prisma.salary.findMany({
    include: { company: { select: { name: true } } },
  })
  const allMappings = await prisma.levelMapping.findMany({
    include: { company: { select: { name: true } } },
  })

  // Build lookup: companyName + companyLevel → normalizedLevel
  const levelLookup = new Map<string, number>()
  for (const m of allMappings) {
    levelLookup.set(`${m.company.name}::${m.companyLevel}`, m.normalizedLevel)
  }

  // Compute avg total per company per normalized level
  const compLevelComp = new Map<string, number[]>()
  for (const s of salaries) {
    const nl = levelLookup.get(`${s.company.name}::${s.level}`)
    if (nl !== undefined) {
      const key = `${s.company.name}::${nl}`
      const arr = compLevelComp.get(key) || []
      arr.push(s.base + s.bonus + s.stock)
      compLevelComp.set(key, arr)
    }
  }

  const compData: Record<string, Record<number, number>> = {}
  for (const [key, totals] of compLevelComp.entries()) {
    const [companyName, nl] = key.split('::')
    if (!compData[companyName]) compData[companyName] = {}
    compData[companyName][parseInt(nl)] = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
  }

  return NextResponse.json({
    levels: Array.from(grouped.values()),
    companyNames: [...new Set(allMappings.map((m) => m.company.name))].sort(),
    compensation: compData,
  })
}
