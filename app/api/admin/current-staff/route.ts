import { DateTime } from "luxon"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("staff_checkin")

    const startOfDay = DateTime.now().setZone("Africa/Lagos").startOf("day").toUTC().toJSDate()
    const endOfDay = DateTime.now().setZone("Africa/Lagos").endOf("day").toUTC().toJSDate()

    const checkIns = await db.collection("attendance").find({
      timestamp: { $gte: startOfDay, $lte: endOfDay },
      type: "check-in",
    }).toArray()

    const checkOuts = await db.collection("attendance").find({
      timestamp: { $gte: startOfDay, $lte: endOfDay },
      type: "check-out",
    }).toArray()

    const currentlyIn = checkIns.filter(
      (checkIn) => !checkOuts.some((checkOut) => checkOut.staffId === checkIn.staffId),
    )

    return NextResponse.json(
      { currentStaff: currentlyIn },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Surrogate-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching current staff:", error)
    return NextResponse.json({ error: "Failed to fetch current staff" }, { status: 500 })
  }
}
