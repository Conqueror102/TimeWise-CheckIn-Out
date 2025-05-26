import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("staff_checkin")

    let settings = await db.collection("settings").findOne({})

    if (!settings) {
      // Create default settings
      settings = {
        latenessTime: "09:00",
        workEndTime: "17:00",
      }
      await db.collection("settings").insertOne(settings)
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { latenessTime, workEndTime } = await request.json()

    const client = await clientPromise
    const db = client.db("staff_checkin")

    await db.collection("settings").updateOne(
      {},
      {
        $set: { latenessTime, workEndTime },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
