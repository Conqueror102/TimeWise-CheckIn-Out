import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { staffId, type } = await request.json()

    if (!staffId || !type) {
      return NextResponse.json({ error: "Staff ID and type are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("staff_checkin")

    // Get staff details
    const staff = await db.collection("staff").findOne({ staffId })
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Get admin settings for lateness check
    const settings = await db.collection("settings").findOne({})
    const latenessTime = settings?.latenessTime || "09:00"

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]

    // Check if late (only for check-in)
    const isLate = type === "check-in" && currentTime > latenessTime

    const attendanceLog = {
      staffId,
      staffName: staff.name,
      department: staff.department,
      type,
      timestamp: now,
      date: currentDate,
      isLate: isLate || false,
    }

    await db.collection("attendance").insertOne(attendanceLog)

    return NextResponse.json({
      success: true,
      message: `${type === "check-in" ? "Checked in" : "Checked out"} successfully`,
      isLate,
      staff: staff.name,
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 })
  }
}
