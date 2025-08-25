import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// TODO: Add admin authentication/authorization check here

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("staff_checkin")
    const staffList = await db.collection("staff").find({}).toArray()
    return NextResponse.json({ staff: staffList })
  } catch (error) {
    console.error("Error fetching all staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff list" }, { status: 500 })
  }
} 