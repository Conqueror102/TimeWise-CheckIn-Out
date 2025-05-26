import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    const client = await clientPromise
    const db = client.db("staff_checkin")

    // Get all staff
    const allStaff = await db.collection("staff").find({}).toArray()

    // Get staff who checked in on the specified date
    const checkedInStaff = await db
      .collection("attendance")
      .find({
        date,
        type: "check-in",
      })
      .toArray()

    const checkedInStaffIds = checkedInStaff.map((log) => log.staffId)

    // Find absent staff
    const absentStaff = allStaff.filter((staff) => !checkedInStaffIds.includes(staff.staffId))

    return NextResponse.json({ absentStaff, date })
  } catch (error) {
    console.error("Error fetching absent staff:", error)
    return NextResponse.json({ error: "Failed to fetch absent staff" }, { status: 500 })
  }
}
