import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// GET /api/salaries
// Filterable, sortable, paginated salary list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const company = searchParams.get("company");
  const role = searchParams.get("role");
  const level = searchParams.get("level");
  const location = searchParams.get("location");
  const currency = searchParams.get("currency");
  const sort = searchParams.get("sort") || "total_comp_desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  // Cap limit at 100 — returning rows unbounded is a hard failure
  const rawLimit = parseInt(searchParams.get("limit") || "25");
  const limit = Math.min(Math.max(1, rawLimit), 100);

  // ── Build WHERE clause ──
  const where: Prisma.SalaryWhereInput = {};

  // company and role use PostgreSQL ILIKE for case-insensitive partial matching
  if (company) {
    where.company = {
      name: { contains: company, mode: "insensitive" },
    };
  }
  if (role) {
    where.role = { contains: role, mode: "insensitive" };
  }
  // Level is exact enum match
  if (level) {
    where.level = level as Prisma.EnumLevelFilter["equals"];
  }
  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (currency) {
    where.currency = currency as Prisma.EnumCurrencyFilter["equals"];
  }

  // ── Sort ──
  let orderBy: Prisma.SalaryOrderByWithRelationInput = {};
  switch (sort) {
    case "total_comp_asc":
      orderBy = { total_compensation: "asc" };
      break;
    case "date_desc":
      orderBy = { submitted_at: "desc" };
      break;
    case "total_comp_desc":
    default:
      orderBy = { total_compensation: "desc" };
      break;
  }

  // ── Query with pagination ──
  const [salaries, total] = await Promise.all([
    prisma.salary.findMany({
      where,
      include: { company: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salary.count({ where }),
  ]);

  // Serialize BigInt fields
  const data = salaries.map((s) => ({
    ...s,
    base_salary: Number(s.base_salary),
    bonus: Number(s.bonus),
    stock: Number(s.stock),
    total_compensation: Number(s.total_compensation),
    confidence_score: Number(s.confidence_score),
  }));

  const response = NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });

  // Cache-Control for Cloudflare CDN
  response.headers.set(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate=3600"
  );

  return response;
}
