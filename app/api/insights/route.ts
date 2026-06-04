import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const salaries = await prisma.salary.findMany({
    include: { company: { select: { name: true } } },
  })

  // Top paying companies by avg total comp
  const companyMap = new Map<string, number[]>()
  for (const s of salaries) {
    const total = s.base + s.bonus + s.stock
    const arr = companyMap.get(s.company.name) || []
    arr.push(total)
    companyMap.set(s.company.name, arr)
  }
  const topPaying = Array.from(companyMap.entries())
    .map(([company, totals]) => ({
      company,
      avg: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10)

  // Location breakdown
  const locationMap = new Map<string, number[]>()
  for (const s of salaries) {
    const total = s.base + s.bonus + s.stock
    const arr = locationMap.get(s.location) || []
    arr.push(total)
    locationMap.set(s.location, arr)
  }
  const locationBreakdown = Array.from(locationMap.entries())
    .map(([location, totals]) => ({
      location,
      avg: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length),
      count: totals.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  // Role breakdown
  const roleMap = new Map<string, number[]>()
  for (const s of salaries) {
    const total = s.base + s.bonus + s.stock
    const arr = roleMap.get(s.role) || []
    arr.push(total)
    roleMap.set(s.role, arr)
  }
  const roleBreakdown = Array.from(roleMap.entries())
    .map(([role, totals]) => ({
      role,
      avg: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length),
      count: totals.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  // Generate text insights
  const insights: string[] = []

  if (topPaying.length >= 2) {
    const pctDiff = Math.round(((topPaying[0].avg - topPaying[topPaying.length - 1].avg) / topPaying[topPaying.length - 1].avg) * 100)
    insights.push(`${topPaying[0].company} pays ${pctDiff}% more in total compensation than ${topPaying[topPaying.length - 1].company} on average.`)
  }

  if (locationBreakdown.length >= 2) {
    insights.push(`${locationBreakdown[0].location} is the highest-paying city with an average total comp of ₹${(locationBreakdown[0].avg / 100000).toFixed(1)}L.`)
  }

  const seniorSalaries = salaries.filter((s) => s.yoe >= 7)
  const juniorSalaries = salaries.filter((s) => s.yoe <= 2)
  if (seniorSalaries.length > 0 && juniorSalaries.length > 0) {
    const avgSenior = Math.round(seniorSalaries.reduce((sum, s) => sum + s.base + s.bonus + s.stock, 0) / seniorSalaries.length)
    const avgJunior = Math.round(juniorSalaries.reduce((sum, s) => sum + s.base + s.bonus + s.stock, 0) / juniorSalaries.length)
    const multiplier = (avgSenior / avgJunior).toFixed(1)
    insights.push(`Senior engineers (7+ YoE) earn ${multiplier}x more than junior engineers (0-2 YoE) on average.`)
  }

  const verifiedCount = salaries.filter((s) => s.verified).length
  insights.push(`${verifiedCount} out of ${salaries.length} salary entries (${Math.round((verifiedCount / salaries.length) * 100)}%) are verified.`)

  return NextResponse.json({
    topPaying,
    locationBreakdown,
    roleBreakdown,
    insights,
    totalEntries: salaries.length,
    totalCompanies: companyMap.size,
  })
}
