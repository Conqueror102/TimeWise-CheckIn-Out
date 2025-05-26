import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("staff_checkin")

    const today = new Date().toISOString().split("T")[0]

    // Get all check-ins for today
    const checkIns = await db
      .collection("attendance")
      .find({
        date: today,
        type: "check-in",
      })
      .toArray()

    // Get all check-outs for today
    const checkOuts = await db
      .collection("attendance")
      .find({
        date: today,
        type: "check-out",
      })
      .toArray()

    // Find staff who checked in but haven't checked out
    const currentlyIn = checkIns.filter(
      (checkIn) => !checkOuts.some((checkOut) => checkOut.staffId === checkIn.staffId),
    )

    return NextResponse.json({ currentStaff: currentlyIn })
  } catch (error) {
    console.error("Error fetching current staff:", error)
    return NextResponse.json({ error: "Failed to fetch current staff" }, { status: 500 })
  }
}
