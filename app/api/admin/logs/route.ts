import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const department = searchParams.get("department")
    const lateOnly = searchParams.get("lateOnly") === "true"

    const client = await clientPromise
    const db = client.db("staff_checkin")

    const query: any = {}

    if (date) {
      query.date = date
    }

    if (department && department !== "all") {
      query.department = department
    }

    if (lateOnly) {
      query.isLate = true
    }

    const logs = await db.collection("attendance").find(query).sort({ timestamp: -1 }).toArray()

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
