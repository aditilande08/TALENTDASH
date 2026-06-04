import { prisma } from "@/lib/prisma";
import {
  normalizeCompanyName,
  slugify,
  VALID_LEVELS,
  VALID_CURRENCIES,
  VALID_SOURCES,
} from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// POST /api/ingest-salary
// Validation → Normalisation → Dedup → Store
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Step 1: Validation Pipeline (in order) ──

    // 1a. Required fields present
    const requiredFields = [
      "company",
      "role",
      "level",
      "location",
      "currency",
      "experience_years",
      "base_salary",
      "source",
      "confidence_score",
    ];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: true, field, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // 1b. Type checks
    if (typeof body.company !== "string") {
      return NextResponse.json(
        { error: true, field: "company", message: "company must be a string" },
        { status: 400 }
      );
    }
    if (typeof body.role !== "string") {
      return NextResponse.json(
        { error: true, field: "role", message: "role must be a string" },
        { status: 400 }
      );
    }
    if (typeof body.experience_years !== "number") {
      return NextResponse.json(
        {
          error: true,
          field: "experience_years",
          message: "experience_years must be a number",
        },
        { status: 400 }
      );
    }
    if (typeof body.base_salary !== "number") {
      return NextResponse.json(
        {
          error: true,
          field: "base_salary",
          message: "base_salary must be a number",
        },
        { status: 400 }
      );
    }
    if (typeof body.confidence_score !== "number") {
      return NextResponse.json(
        {
          error: true,
          field: "confidence_score",
          message: "confidence_score must be a number",
        },
        { status: 400 }
      );
    }

    // 1c. Level is valid enum
    if (!VALID_LEVELS.includes(body.level)) {
      return NextResponse.json(
        {
          error: true,
          field: "level",
          message: `Level must be one of: ${VALID_LEVELS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 1d. Currency is valid enum
    if (!VALID_CURRENCIES.includes(body.currency)) {
      return NextResponse.json(
        {
          error: true,
          field: "currency",
          message: `Currency must be one of: ${VALID_CURRENCIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 1e. Source is valid enum
    if (!VALID_SOURCES.includes(body.source)) {
      return NextResponse.json(
        {
          error: true,
          field: "source",
          message: `Source must be one of: ${VALID_SOURCES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 1f. experience_years > 0 and < 51
    if (body.experience_years < 0 || body.experience_years > 50) {
      return NextResponse.json(
        {
          error: true,
          field: "experience_years",
          message: "experience_years must be between 0 and 50",
        },
        { status: 400 }
      );
    }

    // 1g. base_salary > 0
    if (body.base_salary <= 0) {
      return NextResponse.json(
        {
          error: true,
          field: "base_salary",
          message: "base_salary must be greater than 0",
        },
        { status: 400 }
      );
    }

    // 1h. confidence_score between 0.0 and 1.0
    if (body.confidence_score < 0 || body.confidence_score > 1) {
      return NextResponse.json(
        {
          error: true,
          field: "confidence_score",
          message: "confidence_score must be between 0.0 and 1.0",
        },
        { status: 400 }
      );
    }

    // ── Step 2: Normalisation ──
    const normalizedName = normalizeCompanyName(body.company);
    const companySlug = slugify(normalizedName);

    // Find or create Company
    let company = await prisma.company.findFirst({
      where: { normalized_name: normalizedName },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: body.company.trim(),
          slug: companySlug,
          normalized_name: normalizedName,
        },
      });
    }

    // ── Step 3: Recompute total_compensation ──
    // RULE: ALWAYS computed server-side. Strip any client-submitted value.
    const baseSalary = BigInt(Math.round(body.base_salary));
    const bonus = BigInt(Math.round(body.bonus ?? 0));
    const stock = BigInt(Math.round(body.stock ?? 0));
    const totalCompensation = baseSalary + bonus + stock;

    // ── Step 4: Duplicate Check ──
    // Same company_id + role + level + location within 48 hours, base within 10%
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const duplicates = await prisma.salary.findMany({
      where: {
        company_id: company.id,
        role: body.role.trim(),
        level: body.level,
        location: body.location.trim(),
        submitted_at: { gte: fortyEightHoursAgo },
      },
    });

    const hasDuplicate = duplicates.some((d) => {
      const existingBase = Number(d.base_salary);
      const newBase = body.base_salary;
      const diff = Math.abs(existingBase - newBase) / existingBase;
      return diff <= 0.1; // Within 10%
    });

    if (hasDuplicate) {
      return NextResponse.json(
        {
          error: true,
          field: "duplicate",
          message:
            "A similar record (same company, role, level, location with base salary within 10%) was submitted in the last 48 hours",
        },
        { status: 409 }
      );
    }

    // ── Step 5: Store ──
    const salary = await prisma.salary.create({
      data: {
        company_id: company.id,
        role: body.role.trim(),
        level: body.level,
        location: body.location.trim(),
        currency: body.currency,
        experience_years: body.experience_years,
        base_salary: baseSalary,
        bonus,
        stock,
        total_compensation: totalCompensation,
        source: body.source,
        confidence_score: body.confidence_score,
        is_verified: false,
      },
      include: {
        company: true,
      },
    });

    // Serialize BigInt fields to numbers for JSON response
    return NextResponse.json(
      {
        ...salary,
        base_salary: Number(salary.base_salary),
        bonus: Number(salary.bonus),
        stock: Number(salary.stock),
        total_compensation: Number(salary.total_compensation),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Ingest salary error:", err);
    return NextResponse.json(
      { error: true, field: "server", message: "Internal server error" },
      { status: 500 }
    );
  }
}
