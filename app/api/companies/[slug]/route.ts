import { prisma } from "@/lib/prisma";
import { median } from "@/lib/utils";
import { NextResponse } from "next/server";

// GET /api/companies/[slug]
// Returns: company metadata, salary list, median TC, level distribution
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      salaries: {
        orderBy: { total_compensation: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json(
      { error: true, message: "Company not found" },
      { status: 404 }
    );
  }

  // ── Compute MEDIAN total compensation (NOT average) ──
  const tcValues = company.salaries.map((s) => Number(s.total_compensation));
  const medianTC = median(tcValues);

  // ── Level distribution: counts per level ──
  const levelDist: Record<string, number> = {};
  for (const s of company.salaries) {
    levelDist[s.level] = (levelDist[s.level] || 0) + 1;
  }

  // Min/max TC
  const minTC = tcValues.length > 0 ? Math.min(...tcValues) : 0;
  const maxTC = tcValues.length > 0 ? Math.max(...tcValues) : 0;

  // Serialize BigInt fields
  const salaries = company.salaries.map((s) => ({
    ...s,
    base_salary: Number(s.base_salary),
    bonus: Number(s.bonus),
    stock: Number(s.stock),
    total_compensation: Number(s.total_compensation),
    confidence_score: Number(s.confidence_score),
  }));

  const response = NextResponse.json({
    id: company.id,
    name: company.name,
    slug: company.slug,
    normalized_name: company.normalized_name,
    industry: company.industry,
    headquarters: company.headquarters,
    founded_year: company.founded_year,
    headcount_range: company.headcount_range,
    created_at: company.created_at,
    updated_at: company.updated_at,
    salaries,
    median_total_compensation: medianTC,
    level_distribution: levelDist,
    salary_count: company.salaries.length,
    min_tc: minTC,
    max_tc: maxTC,
  });

  // Cache for 1 hour, stale-while-revalidate for 24 hours
  response.headers.set(
    "Cache-Control",
    "s-maxage=3600, stale-while-revalidate=86400"
  );

  return response;
}
