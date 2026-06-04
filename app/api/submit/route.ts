import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, role, level, location, base, bonus, stock, yoe } = body

    // Validation
    if (!companyId || !role || !level || !location || !base) {
      return NextResponse.json({ error: 'Missing required fields: companyId, role, level, location, base' }, { status: 400 })
    }

    if (typeof base !== 'number' || base < 0) {
      return NextResponse.json({ error: 'Base salary must be a positive number' }, { status: 400 })
    }

    // Check company exists
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const salary = await prisma.salary.create({
      data: {
        companyId,
        role: role.trim(),
        level: level.trim(),
        location: location.trim(),
        base: Math.round(base),
        bonus: Math.round(bonus || 0),
        stock: Math.round(stock || 0),
        yoe: yoe || 0,
        verified: false,
      },
    })

    return NextResponse.json({ success: true, id: salary.id }, { status: 201 })
  } catch (err) {
    console.error('Salary submission error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
