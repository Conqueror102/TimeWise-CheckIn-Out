import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateQRCode } from "@/lib/utils/qr-generator"
import { generateUniqueStaffId } from "@/lib/utils/id-generator"

export async function POST(request: NextRequest) {
  try {
    const { name, department, position } = await request.json()

    if (!name || !department || !position) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Generate unique mixed alphanumeric staff ID
    const staffId = await generateUniqueStaffId(db)

    // Generate QR code
    const qrCode = await generateQRCode(staffId)

    const newStaff = {
      staffId,
      name,
      department,
      position,
      qrCode,
      createdAt: new Date(),
    }

    const result = await db.collection("staff").insertOne(newStaff)

    return NextResponse.json({
      success: true,
      staff: { ...newStaff, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register staff" }, { status: 500 })
  }
}
