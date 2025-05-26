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
    const currentTime = now.toISOString().slice(11, 16)
    const currentDate = now.toISOString().split("T")[0]

    // Check for existing attendance log for this type today
    const existingLog = await db.collection("attendance").findOne({
      staffId,
      date: currentDate,
      type,
    })

    if (existingLog) {
      return NextResponse.json({
        error: `Already ${type === "check-in" ? "checked in" : "checked out"} today`,
      }, { status: 400 })
    }

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

    // Insert new attendance log
    await db.collection("attendance").insertOne(attendanceLog)

    // Fetch full attendance logs for the staff for today
    const attendanceLogs = await db.collection("attendance")
      .find({ staffId, date: currentDate })
      .sort({ timestamp: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      message: `${type === "check-in" ? "Checked in" : "Checked out"} successfully`,
      isLate,
      staff: staff.name,
      attendanceLogs,  // full log for today
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 })
  }
}
