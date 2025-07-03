import { type NextRequest, NextResponse } from "next/server"
import { DateTime } from "luxon"
import clientPromise from "@/lib/mongodb"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  const token = authHeader.replace("Bearer ", "")
  if (!JWT_SECRET) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload === "object" && payload.type === "admin") {
      return payload
    }
  } catch {}
  return null
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date") // e.g. "2025-05-27"
    const department = searchParams.get("department")
    const lateOnly = searchParams.get("lateOnly") === "true"

    const client = await clientPromise
    const db = client.db("staff_checkin")

    const query: any = {}

    // ⏱ Replace "date" with timestamp range filtering (Lagos time normalized to UTC)
    if (dateParam) {
      const start = DateTime.fromISO(dateParam, { zone: "Africa/Lagos" })
        .startOf("day")
        .toUTC()
        .toJSDate()

      const end = DateTime.fromISO(dateParam, { zone: "Africa/Lagos" })
        .endOf("day")
        .toUTC()
        .toJSDate()

      query.timestamp = { $gte: start, $lte: end }
    }

    if (department && department !== "all") {
      query.department = department
    }

    if (lateOnly) {
      query.isLate = true
    }

    const logs = await db
      .collection("attendance")
      .find(query)
      .sort({ timestamp: -1 })
      .toArray()

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
