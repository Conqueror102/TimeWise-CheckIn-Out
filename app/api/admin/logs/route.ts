import { type NextRequest, NextResponse } from "next/server"
import { DateTime } from "luxon"
import clientPromise from "@/lib/mongodb"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
