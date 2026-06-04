import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/companies — list all companies with basic stats
export async function GET() {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { salaries: true } },
      salaries: {
        select: { total_compensation: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const data = companies.map((c) => {
    const tcValues = c.salaries.map((s) => Number(s.total_compensation));
    const avgTC =
      tcValues.length > 0
        ? Math.round(tcValues.reduce((a, b) => a + b, 0) / tcValues.length)
        : 0;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      industry: c.industry,
      headquarters: c.headquarters,
      headcount_range: c.headcount_range,
      salary_count: c._count.salaries,
      avg_total_compensation: avgTC,
    };
  });

  return NextResponse.json(data);
}
