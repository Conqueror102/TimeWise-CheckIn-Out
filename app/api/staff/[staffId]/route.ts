import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("staff_checkin")

    const staff = await db.collection("staff").findOne({ staffId: params.staffId })

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}
