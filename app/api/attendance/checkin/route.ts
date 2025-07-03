import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { DateTime } from "luxon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: NextRequest) {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }
    const token = authHeader.replace("Bearer ", "")
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Server misconfiguration: JWT secret missing" }, { status: 500 })
    }
    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 })
    }
    // Accept only scan or admin tokens
    if (payload.type !== "scan" && payload.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Invalid token type" }, { status: 401 })
    }

    const { staffId, type, photoUrl } = await request.json()

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

    // Use Luxon to get current date/time in Africa/Lagos timezone
    const now = DateTime.now().setZone("Africa/Lagos")
    const currentTime = now.toFormat("HH:mm")
    const currentDate = now.toFormat("yyyy-MM-dd")

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
      timestamp: now.toJSDate(),  // convert Luxon DateTime to JS Date
      date: currentDate,
      isLate: isLate || false,
      ...(photoUrl ? { photoUrl } : {}),
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
      attendanceLogs,
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 })
  }
}
