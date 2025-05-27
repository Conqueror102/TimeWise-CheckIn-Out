import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { DateTime } from "luxon"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || DateTime.now().setZone("Africa/Lagos").toFormat("yyyy-MM-dd")

    const client = await clientPromise
    const db = client.db("staff_checkin")

    // Fetch logs for the date
    const logs = await db.collection("attendance")
      .find({ date })
      .sort({ timestamp: -1 })
      .toArray()

    // Fetch all staff
    const allStaff = await db.collection("staff").find().toArray()
    const totalStaff = allStaff.length

    // Build latest log per staff
    const latestLogs: Record<string, any> = {}
    logs.forEach(log => {
      if (!latestLogs[log.staffId]) {
        latestLogs[log.staffId] = log
      }
    })

    // Calculate currently in
    const currentlyIn = Object.values(latestLogs).filter(log => log.type === "check-in")

    // Calculate late count
    const lateCount = logs.filter(log => log.isLate).length

    // Calculate absentees
    const presentStaffIds = new Set(logs.map(log => log.staffId))
    const absentStaff = allStaff.filter(staff => !presentStaffIds.has(staff.staffId))
    const absentCount = absentStaff.length

    return NextResponse.json({
      logs,
      stats: {
        totalStaff,
        lateCount,
        absentCount,
        currentlyInCount: currentlyIn.length,
      },
      currentlyIn,
      absentStaff
    })

  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
