import { type NextRequest, NextResponse } from "next/server"
import { DateTime } from "luxon"
import clientPromise from "@/lib/mongodb"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date") || DateTime.now().setZone("Africa/Lagos").toISODate()

    const start = DateTime.fromISO(dateParam, { zone: "Africa/Lagos" }).startOf("day").toUTC().toJSDate()
    const end = DateTime.fromISO(dateParam, { zone: "Africa/Lagos" }).endOf("day").toUTC().toJSDate()

    const client = await clientPromise
    const db = client.db("staff_checkin")

    // Get all staff
    const allStaff = await db.collection("staff").find({}).toArray()

    // Get staff who checked in on the specified date (by timestamp)
    const checkedInStaff = await db
      .collection("attendance")
      .find({
        timestamp: { $gte: start, $lte: end },
        type: "check-in",
      })
      .toArray()

    const checkedInStaffIds = checkedInStaff.map((log) => log.staffId)

    // Find absent staff
    const absentStaff = allStaff.filter((staff) => !checkedInStaffIds.includes(staff.staffId))

    return NextResponse.json({ absentStaff, date: dateParam })
  } catch (error) {
    console.error("Error fetching absent staff:", error)
    return NextResponse.json({ error: "Failed to fetch absent staff" }, { status: 500 })
  }
}
